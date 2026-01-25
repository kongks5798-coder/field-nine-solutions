/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: PRODUCTION KAUS PURCHASE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ZERO SIMULATION - 실제 결제 검증 없이 코인 지급 불가
 * "유령 거래 차단 - 모든 거래는 검증된다"
 *
 * SECURITY:
 * - PayPal 결제 검증 필수
 * - Server-side balance 업데이트만 허용
 * - SHA-256 해시 체인 감사 로그
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalClient } from '@/lib/payment/paypal';
import { auditLogger } from '@/lib/audit/logger';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - 금융 표준 준수
// ═══════════════════════════════════════════════════════════════════════════════

const PURCHASE_PACKAGES = [
  { id: 'starter', kausAmount: 1000, priceKRW: 100000, priceUSD: 75, bonus: 0, label: 'Starter' },
  { id: 'growth', kausAmount: 5000, priceKRW: 475000, priceUSD: 350, bonus: 5, label: 'Growth' },
  { id: 'premium', kausAmount: 10000, priceKRW: 900000, priceUSD: 670, bonus: 10, label: 'Premium' },
  { id: 'sovereign', kausAmount: 50000, priceKRW: 4000000, priceUSD: 3000, bonus: 20, label: 'Sovereign' },
] as const;

// 소수점 8자리 정밀도 (금융 표준)
const DECIMAL_PRECISION = 8;

function toFinancialPrecision(value: number): number {
  return Number(value.toFixed(DECIMAL_PRECISION));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT (Server-side only)
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Alert Admin on suspicious activity
// ═══════════════════════════════════════════════════════════════════════════════

async function alertSecurityIncident(
  type: 'PAYMENT_FAILED' | 'UNAUTHORIZED_ACCESS' | 'BALANCE_MANIPULATION',
  details: Record<string, unknown>
) {
  const incident = {
    type,
    timestamp: new Date().toISOString(),
    details,
    severity: type === 'BALANCE_MANIPULATION' ? 'CRITICAL' : 'HIGH',
  };

  console.error('[SECURITY ALERT]', JSON.stringify(incident));

  // Log to audit trail
  await auditLogger.log({
    eventType: 'API_KEY_REVOKED', // Using existing type for security events
    userId: 'SYSTEM',
    status: 'FAILED',
    details: incident,
  });

  // TODO: Send webhook/email to admin
  // await fetch(process.env.ADMIN_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(incident) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE BALANCE UPDATE (Only after payment verification)
// ═══════════════════════════════════════════════════════════════════════════════

async function updateUserBalance(
  userId: string,
  kausAmount: number,
  transactionId: string,
  paymentVerified: boolean
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // CRITICAL: Block any balance update without payment verification
  if (!paymentVerified) {
    await alertSecurityIncident('BALANCE_MANIPULATION', {
      userId,
      attemptedAmount: kausAmount,
      transactionId,
      reason: 'Attempted balance update without payment verification',
    });
    return { success: false, error: 'Payment verification required' };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'Database connection unavailable' };
  }

  try {
    // Get current balance
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('kaus_balance')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return { success: false, error: 'User not found' };
    }

    const currentBalance = toFinancialPrecision(user.kaus_balance || 0);
    const newBalance = toFinancialPrecision(currentBalance + kausAmount);

    // Update balance with transaction record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        kaus_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: 'Balance update failed' };
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'PURCHASE',
      amount: kausAmount,
      balance_after: newBalance,
      reference_id: transactionId,
      verified: true,
      created_at: new Date().toISOString(),
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('[Balance Update Error]', error);
    return { success: false, error: 'Internal error' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Initiate Purchase (Creates PayPal order, NO coin granted yet)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, currency, paymentMethod, userId } = body;

    // Validate package
    const pkg = PURCHASE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Invalid package' }, { status: 400 });
    }

    // Validate user
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User authentication required' }, { status: 401 });
    }

    const amount = currency === 'KRW' ? pkg.priceKRW : pkg.priceUSD;
    const bonusAmount = toFinancialPrecision(pkg.kausAmount * (pkg.bonus / 100));
    const totalKaus = toFinancialPrecision(pkg.kausAmount + bonusAmount);
    const referenceId = `KAUS-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // ═══════════════════════════════════════════════════════════════════════════
    // PAYPAL PAYMENT FLOW
    // ═══════════════════════════════════════════════════════════════════════════

    if (paymentMethod === 'paypal') {
      const paypal = getPayPalClient();

      // CRITICAL: Block if PayPal not configured
      if (!paypal.isConfigured) {
        await auditLogger.log({
          eventType: 'KAUS_PURCHASE',
          userId,
          amount: totalKaus,
          currency,
          status: 'FAILED',
          details: {
            referenceId,
            packageId,
            reason: 'Payment gateway not configured',
          },
        });

        return NextResponse.json({
          success: false,
          error: 'Payment gateway temporarily unavailable. Please try again later.',
          code: 'GATEWAY_UNAVAILABLE',
        }, { status: 503 });
      }

      // Create PayPal order
      const result = await paypal.createOrder({
        amount,
        currency,
        description: `KAUS Coin - ${pkg.label} (${totalKaus.toLocaleString()} KAUS)`,
        referenceId,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io'}/api/kaus/purchase/verify?ref=${referenceId}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io'}/nexus/exchange?cancelled=true`,
      });

      if (!result.success || !result.order) {
        await alertSecurityIncident('PAYMENT_FAILED', {
          userId,
          referenceId,
          error: result.error,
        });

        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      // Log PENDING status (coins NOT granted yet)
      await auditLogger.log({
        eventType: 'KAUS_PURCHASE',
        userId,
        amount: totalKaus,
        currency,
        status: 'PENDING',
        details: {
          referenceId,
          packageId,
          paypalOrderId: result.order.id,
          bonusAmount,
          awaitingVerification: true,
        },
      });

      const approvalUrl = result.order.links.find((link: { rel: string }) => link.rel === 'approve')?.href;

      return NextResponse.json({
        success: true,
        orderId: referenceId,
        paypalOrderId: result.order.id,
        approvalUrl,
        kausAmount: pkg.kausAmount,
        bonusAmount,
        totalKaus,
        status: 'AWAITING_PAYMENT',
        message: 'Please complete payment to receive your KAUS coins',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOSS PAYMENT FLOW (Korea)
    // ═══════════════════════════════════════════════════════════════════════════

    if (paymentMethod === 'toss') {
      // Similar flow - create payment, await verification
      return NextResponse.json({
        success: false,
        error: 'Toss payment integration pending',
        code: 'GATEWAY_PENDING',
      }, { status: 503 });
    }

    return NextResponse.json({ success: false, error: 'Unsupported payment method' }, { status: 400 });

  } catch (error) {
    console.error('[KAUS Buy] Critical Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Package Information
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    success: true,
    packages: PURCHASE_PACKAGES.map(pkg => ({
      ...pkg,
      priceKRW: toFinancialPrecision(pkg.priceKRW),
      priceUSD: toFinancialPrecision(pkg.priceUSD),
    })),
    rates: {
      KRW: toFinancialPrecision(120),
      USD: toFinancialPrecision(0.09),
    },
    paymentMethods: ['paypal'],
    notice: 'All purchases require payment verification before KAUS coins are credited.',
  });
}
