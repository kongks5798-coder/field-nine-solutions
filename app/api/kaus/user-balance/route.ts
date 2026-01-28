/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USER KAUS BALANCE API - PRODUCTION GRADE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Returns authenticated user's KAUS balance from Supabase.
 * Creates wallet record if user doesn't have one.
 *
 * PRODUCTION: Real DB data only - no simulation
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// KAUS pricing constants
const KAUS_PRICE_USD = 0.10;
const KAUS_PRICE_KRW = 120;

interface UserWallet {
  id: string;
  user_id: string;
  kaus_balance: number;
  kwh_balance: number;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        kausBalance: 0,
        kwhBalance: 0,
        krwValue: 0,
        usdValue: 0,
        isLive: false,
      }, { status: 401 });
    }

    // Fetch user's wallet from database
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no wallet exists, create one with initial balance
    if (walletError && walletError.code === 'PGRST116') {
      // No row found - create new wallet
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          kaus_balance: 100, // Welcome bonus: 100 KAUS
          kwh_balance: 10,   // Welcome bonus: 10 kWh
        })
        .select()
        .single();

      if (createError) {
        console.error('[USER BALANCE] Create wallet error:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create wallet',
          kausBalance: 0,
          kwhBalance: 0,
          krwValue: 0,
          usdValue: 0,
          isLive: false,
        }, { status: 500 });
      }

      const kausBalance = newWallet?.kaus_balance || 0;
      const kwhBalance = newWallet?.kwh_balance || 0;

      return NextResponse.json({
        success: true,
        userId: user.id,
        email: user.email,
        kausBalance,
        kwhBalance,
        krwValue: kausBalance * KAUS_PRICE_KRW,
        usdValue: kausBalance * KAUS_PRICE_USD,
        isLive: true,
        isNewUser: true,
        welcomeBonus: {
          kaus: 100,
          kwh: 10,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (walletError) {
      console.error('[USER BALANCE] Wallet fetch error:', walletError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        kausBalance: 0,
        kwhBalance: 0,
        krwValue: 0,
        usdValue: 0,
        isLive: false,
      }, { status: 500 });
    }

    const kausBalance = wallet?.kaus_balance || 0;
    const kwhBalance = wallet?.kwh_balance || 0;

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      kausBalance,
      kwhBalance,
      krwValue: kausBalance * KAUS_PRICE_KRW,
      usdValue: kausBalance * KAUS_PRICE_USD,
      isLive: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[USER BALANCE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
      kausBalance: 0,
      kwhBalance: 0,
      krwValue: 0,
      usdValue: 0,
      isLive: false,
    }, { status: 500 });
  }
}
