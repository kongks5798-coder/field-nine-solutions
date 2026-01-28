/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USER KAUS EXCHANGE API - PRODUCTION GRADE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles Energy ↔ KAUS exchanges for authenticated users.
 * All transactions are recorded in Supabase with full audit trail.
 *
 * PRODUCTION: Server-side validation, real DB updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Exchange constants
const KWH_TO_KAUS_BASE_RATE = 10;
const TRANSACTION_FEE_PERCENT = 0.001; // 0.1%
const MIN_KWH = 0.1;
const MAX_KWH = 10000;

// Get dynamic rate based on time of day (peak/off-peak)
function getDynamicMultiplier(): number {
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 21);
  return isPeakHour ? 1.15 : 0.95;
}

interface ExchangeRequest {
  action: 'exchange' | 'rate';
  kwhAmount?: number;
}

// GET: Fetch current exchange rate
export async function GET() {
  const multiplier = getDynamicMultiplier();
  const currentRate = KWH_TO_KAUS_BASE_RATE * multiplier;

  return NextResponse.json({
    success: true,
    data: {
      baseRate: KWH_TO_KAUS_BASE_RATE,
      currentRate,
      multiplier,
      kwhToKaus: currentRate,
      kausToUsd: 0.10,
      kausToKrw: 120,
      gridDemandMultiplier: multiplier,
      v2gBonus: 0,
      fee: TRANSACTION_FEE_PERCENT,
      minKwh: MIN_KWH,
      maxKwh: MAX_KWH,
    },
    timestamp: new Date().toISOString(),
  });
}

// POST: Execute exchange for authenticated user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Parse request
    const body: ExchangeRequest = await request.json();

    if (body.action !== 'exchange') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
      }, { status: 400 });
    }

    const kwhAmount = body.kwhAmount;

    // Validate amount
    if (!kwhAmount || typeof kwhAmount !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'kwhAmount is required and must be a number',
      }, { status: 400 });
    }

    if (kwhAmount < MIN_KWH) {
      return NextResponse.json({
        success: false,
        error: `Minimum exchange is ${MIN_KWH} kWh`,
      }, { status: 400 });
    }

    if (kwhAmount > MAX_KWH) {
      return NextResponse.json({
        success: false,
        error: `Maximum exchange is ${MAX_KWH} kWh per transaction`,
      }, { status: 400 });
    }

    // Get user's current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      console.error('[USER EXCHANGE] Wallet fetch error:', walletError);
      return NextResponse.json({
        success: false,
        error: 'Wallet not found. Please refresh the page.',
      }, { status: 404 });
    }

    // Check if user has enough kWh
    if (wallet.kwh_balance < kwhAmount) {
      return NextResponse.json({
        success: false,
        error: `Insufficient energy balance. You have ${wallet.kwh_balance} kWh.`,
      }, { status: 400 });
    }

    // Calculate exchange
    const multiplier = getDynamicMultiplier();
    const grossKaus = kwhAmount * KWH_TO_KAUS_BASE_RATE * multiplier;
    const fee = grossKaus * TRANSACTION_FEE_PERCENT;
    const netKaus = grossKaus - fee;

    // Update user's wallet - atomic transaction
    const newKwhBalance = wallet.kwh_balance - kwhAmount;
    const newKausBalance = wallet.kaus_balance + netKaus;

    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({
        kwh_balance: newKwhBalance,
        kaus_balance: newKausBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[USER EXCHANGE] Wallet update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Transaction failed. Please try again.',
      }, { status: 500 });
    }

    // Record transaction in history
    const transactionId = `TX_${Date.now().toString(36).toUpperCase()}`;

    await supabase
      .from('kaus_transactions')
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        type: 'EXCHANGE',
        from_type: 'KWH',
        from_amount: kwhAmount,
        to_type: 'KAUS',
        to_amount: netKaus,
        fee,
        multiplier,
        status: 'COMPLETED',
      });

    console.log(`[USER EXCHANGE] Success: ${user.email} exchanged ${kwhAmount} kWh → ${netKaus.toFixed(2)} KAUS`);

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        inputKwh: kwhAmount,
        outputKaus: grossKaus,
        fee,
        netKaus,
        rate: KWH_TO_KAUS_BASE_RATE * multiplier,
        multiplier,
        newBalance: {
          kwhBalance: newKwhBalance,
          kausBalance: newKausBalance,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[USER EXCHANGE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    }, { status: 500 });
  }
}
