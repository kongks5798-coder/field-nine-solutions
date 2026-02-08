/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: TOSS PAYMENTS KAUS PURCHASE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 한국 시장 결제 - 토스페이먼츠
 * 카드결제, 계좌이체, 간편결제 지원
 *
 * Flow:
 * 1. POST: 결제 정보 생성 → 프론트엔드에서 Toss SDK 호출
 * 2. 사용자 결제 완료 → /api/payment/toss/confirm 호출
 * 3. KAUS 지급
 *
 * @route POST /api/kaus/buy/toss
 */

import { NextRequest, NextResponse } from 'next/server';
import { TOSS_CLIENT_KEY, IS_TOSS_CONFIGURED, generateOrderId } from '@/lib/toss/client';
import { auditLogger } from '@/lib/audit/logger';
import { createClient } from '@supabase/supabase-js';
import { PURCHASE_PACKAGES, toFinancialPrecision } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Initialize Toss Payment
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, userId, paymentMethod = 'CARD' } = body;

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다.',
        code: 'AUTH_REQUIRED',
      }, { status: 401 });
    }

    // Validate package
    const pkg = PURCHASE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 패키지입니다.',
        code: 'INVALID_PACKAGE',
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK TOSS CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    if (!IS_TOSS_CONFIGURED) {
      await auditLogger.log({
        eventType: 'KAUS_PURCHASE',
        userId,
        amount: pkg.kausAmount,
        currency: 'KRW',
        status: 'FAILED',
        details: {
          packageId,
          reason: 'Toss not configured',
        },
      });

      return NextResponse.json({
        success: false,
        error: '카드 결제는 현재 준비 중입니다. PayPal을 이용해 주세요.',
        code: 'TOSS_NOT_CONFIGURED',
        availableProviders: ['paypal'],
      }, { status: 503 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE ORDER
    // ═══════════════════════════════════════════════════════════════════════════

    const orderId = `KAUS-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const bonusAmount = toFinancialPrecision(pkg.kausAmount * (pkg.bonus / 100));
    const totalKaus = toFinancialPrecision(pkg.kausAmount + bonusAmount);
    const amount = pkg.priceKRW; // 원화 결제

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io';

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE PENDING ORDER
    // ═══════════════════════════════════════════════════════════════════════════

    const supabase = getSupabaseAdmin();
    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('kaus_orders')
        .insert({
          reference_id: orderId,
          user_id: userId,
          package_id: packageId,
          kaus_amount: pkg.kausAmount,
          bonus_amount: bonusAmount,
          total_kaus: totalKaus,
          price_amount: amount,
          currency: 'KRW',
          payment_method: 'toss',
          status: 'PENDING',
          created_at: new Date().toISOString(),
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOG PENDING
    // ═══════════════════════════════════════════════════════════════════════════

    await auditLogger.log({
      eventType: 'KAUS_PURCHASE',
      userId,
      amount: totalKaus,
      currency: 'KRW',
      status: 'PENDING',
      details: {
        orderId,
        packageId,
        paymentMethod: 'toss',
        tossMethod: paymentMethod,
        priceKRW: amount,
        bonusAmount,
        awaitingPayment: true,
      },
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // RETURN PAYMENT INFO FOR FRONTEND
    // ═══════════════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      orderId,
      orderName: `KAUS 코인 - ${pkg.label} (${totalKaus.toLocaleString()} KAUS)`,
      amount,
      currency: 'KRW',
      kausAmount: pkg.kausAmount,
      bonusAmount,
      totalKaus,
      // Toss SDK configuration
      tossConfig: {
        clientKey: TOSS_CLIENT_KEY,
        method: paymentMethod, // CARD, 계좌이체, etc.
        successUrl: `${appUrl}/api/payment/toss/confirm?orderId=${orderId}`,
        failUrl: `${appUrl}/ko/nexus/exchange?error=toss_failed&orderId=${orderId}`,
      },
      message: '결제 정보가 준비되었습니다. 토스페이먼츠로 결제를 진행하세요.',
    });

  } catch (error) {
    console.error('[KAUS Buy Toss] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '결제 초기화 실패',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Check Toss availability and packages
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    success: true,
    available: IS_TOSS_CONFIGURED,
    provider: 'toss',
    currency: 'KRW',
    methods: IS_TOSS_CONFIGURED ? ['CARD', 'TRANSFER', 'VIRTUAL_ACCOUNT', 'MOBILE_PHONE'] : [],
    packages: PURCHASE_PACKAGES.map(pkg => ({
      id: pkg.id,
      label: pkg.label,
      kausAmount: pkg.kausAmount,
      priceKRW: pkg.priceKRW,
      bonus: pkg.bonus,
      popular: pkg.popular,
    })),
    message: IS_TOSS_CONFIGURED
      ? '토스페이먼츠 결제 가능'
      : 'Toss 결제는 현재 준비 중입니다. PayPal을 이용해 주세요.',
  });
}
