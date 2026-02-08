/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: TOSS PAYMENT CONFIRMATION & KAUS GRANT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 토스페이먼츠 결제 승인 및 KAUS 코인 지급
 *
 * Flow:
 * 1. 사용자가 토스 결제창에서 결제 완료
 * 2. 토스가 successUrl로 리다이렉트 (paymentKey, orderId, amount 전달)
 * 3. 서버에서 결제 승인 API 호출
 * 4. 승인 성공 시 KAUS 코인 지급
 *
 * Security:
 * - 서버사이드 결제 승인
 * - 금액 검증
 * - Double-spend 방지
 * - SHA-256 감사 로깅
 *
 * @route GET /api/payment/toss/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, TOSS_SECRET_KEY } from '@/lib/toss/client';
import { handleTossKausPayment, isKausOrder } from '@/lib/payment/kaus-webhook-handler';
import { auditLogger } from '@/lib/audit/logger';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
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
// GET: Handle Toss Redirect (Success URL)
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io';

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(
      `${appUrl}/ko/nexus/exchange?error=missing_params&code=INVALID_CALLBACK`
    );
  }

  // Check if Toss is configured
  if (!TOSS_SECRET_KEY) {
    return NextResponse.redirect(
      `${appUrl}/ko/nexus/exchange?error=gateway_error&code=TOSS_UNAVAILABLE`
    );
  }

  const parsedAmount = parseInt(amount, 10);

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Verify order exists and amount matches
    // ═══════════════════════════════════════════════════════════════════════════

    const supabase = getSupabaseAdmin();
    let orderData: {
      user_id: string;
      total_kaus: number;
      price_amount: number;
      status: string;
    } | null = null;

    if (supabase && isKausOrder(orderId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('kaus_orders')
        .select('user_id, total_kaus, price_amount, status')
        .eq('reference_id', orderId)
        .single();

      orderData = data;

      if (orderData && orderData.price_amount !== parsedAmount) {
        // Amount mismatch - potential fraud
        await auditLogger.log({
          eventType: 'SECURITY_INCIDENT',
          userId: orderData.user_id,
          status: 'FAILED',
          details: {
            type: 'AMOUNT_MISMATCH',
            orderId,
            expectedAmount: orderData.price_amount,
            receivedAmount: parsedAmount,
            paymentKey,
          },
        });

        return NextResponse.redirect(
          `${appUrl}/ko/nexus/exchange?error=amount_mismatch&code=SECURITY_ERROR`
        );
      }

      if (orderData?.status === 'COMPLETED') {
        return NextResponse.redirect(
          `${appUrl}/ko/nexus/exchange?success=true&already_processed=true`
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Confirm payment with Toss
    // ═══════════════════════════════════════════════════════════════════════════

    const confirmResult = await confirmPayment({
      paymentKey,
      orderId,
      amount: parsedAmount,
    });

    if (!confirmResult.success) {
      await auditLogger.log({
        eventType: 'KAUS_PURCHASE',
        userId: orderData?.user_id || 'UNKNOWN',
        amount: parsedAmount,
        currency: 'KRW',
        status: 'FAILED',
        details: {
          orderId,
          paymentKey,
          error: confirmResult.error,
          step: 'TOSS_CONFIRM',
        },
      });

      return NextResponse.redirect(
        `${appUrl}/ko/nexus/exchange?error=payment_failed&code=TOSS_CONFIRM_FAILED&message=${encodeURIComponent(confirmResult.error || '결제 승인 실패')}`
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Grant KAUS coins
    // ═══════════════════════════════════════════════════════════════════════════

    if (isKausOrder(orderId)) {
      const grantResult = await handleTossKausPayment(
        paymentKey,
        orderId,
        parsedAmount,
        undefined // customer email - not available from redirect
      );

      if (!grantResult.success && !grantResult.alreadyProcessed) {
        // Payment confirmed but KAUS grant failed - CRITICAL
        await auditLogger.log({
          eventType: 'SECURITY_INCIDENT',
          userId: orderData?.user_id || 'UNKNOWN',
          status: 'FAILED',
          details: {
            type: 'PAYMENT_CONFIRMED_BUT_GRANT_FAILED',
            orderId,
            paymentKey,
            amount: parsedAmount,
            error: grantResult.error,
            requiresManualIntervention: true,
          },
        });

        // Still redirect to success but with pending message
        return NextResponse.redirect(
          `${appUrl}/ko/nexus/exchange?success=pending&ref=${orderId}&message=processing`
        );
      }

      // Success!
      const successUrl = new URL(`${appUrl}/ko/nexus/exchange`);
      successUrl.searchParams.set('success', 'true');
      successUrl.searchParams.set('kaus', (grantResult.kausGranted || orderData?.total_kaus || 0).toString());
      successUrl.searchParams.set('ref', orderId);
      successUrl.searchParams.set('provider', 'toss');

      return NextResponse.redirect(successUrl.toString());
    }

    // Non-KAUS order - generic success
    return NextResponse.redirect(
      `${appUrl}/ko/nexus/exchange?success=true&ref=${orderId}&provider=toss`
    );

  } catch (error) {
    console.error('[Toss Confirm] Error:', error);

    await auditLogger.log({
      eventType: 'KAUS_PURCHASE',
      userId: 'UNKNOWN',
      status: 'FAILED',
      details: {
        orderId,
        paymentKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.redirect(
      `${appUrl}/ko/nexus/exchange?error=system_error&code=INTERNAL_ERROR`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Direct API confirmation (for webhooks or manual confirmation)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    // Validation
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.',
        code: 'MISSING_PARAMS',
      }, { status: 400 });
    }

    // Check if Toss is configured
    if (!TOSS_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Toss 결제가 구성되지 않았습니다.',
        code: 'TOSS_NOT_CONFIGURED',
      }, { status: 503 });
    }

    // Confirm payment
    const confirmResult = await confirmPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
    });

    if (!confirmResult.success) {
      return NextResponse.json({
        success: false,
        error: confirmResult.error || '결제 승인 실패',
        code: 'CONFIRM_FAILED',
      }, { status: 400 });
    }

    // Grant KAUS if applicable
    if (isKausOrder(orderId)) {
      const grantResult = await handleTossKausPayment(
        paymentKey,
        orderId,
        Number(amount)
      );

      return NextResponse.json({
        success: grantResult.success,
        orderId,
        paymentKey,
        kausGranted: grantResult.kausGranted,
        newBalance: grantResult.newBalance,
        transactionId: grantResult.transactionId,
        alreadyProcessed: grantResult.alreadyProcessed,
        error: grantResult.error,
      });
    }

    // Non-KAUS order
    return NextResponse.json({
      success: true,
      orderId,
      paymentKey,
      status: confirmResult.status,
      method: confirmResult.method,
      totalAmount: confirmResult.totalAmount,
    });

  } catch (error) {
    console.error('[Toss Confirm POST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '결제 승인 중 오류 발생',
    }, { status: 500 });
  }
}
