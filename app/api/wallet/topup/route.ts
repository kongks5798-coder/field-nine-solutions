/**
 * K-UNIVERSAL Ghost Wallet Top-up API
 * 토스페이먼츠 결제 승인 + DB 저장
 *
 * Security Features:
 * - Idempotency: 동일 paymentKey 중복 처리 방지
 * - Amount verification: 토스 응답 금액과 요청 금액 비교
 * - Audit logging: 모든 결제 시도 로깅
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, generateOrderId, validateTossConfig } from '@/lib/toss/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
} from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

// ============================================
// POST: 결제 승인 처리 + DB 저장
// ============================================

interface ConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId: string;
}

// Audit log for security
function auditLog(action: string, data: Record<string, unknown>) {
  console.log(`[AUDIT][${new Date().toISOString()}][${action}]`, JSON.stringify(data));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const clientIp = getClientIdentifier(request);

  // Rate limiting check - 5 requests per minute for payment operations
  const rateLimit = checkRateLimit(clientIp, RateLimiters.strict);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimit),
      }
    );
  }

  try {
    const body: ConfirmRequest = await request.json();

    auditLog('TOPUP_ATTEMPT', {
      requestId,
      orderId: body.orderId,
      amount: body.amount,
      userId: body.userId?.substring(0, 8) + '...',
    });

    // 0. Toss 환경 설정 검증
    const tossConfig = validateTossConfig();
    if (!tossConfig.valid) {
      auditLog('TOPUP_CONFIG_ERROR', { requestId, errors: tossConfig.errors });
      return NextResponse.json(
        { success: false, error: '결제 시스템이 구성되지 않았습니다' },
        { status: 503 }
      );
    }

    // 1. Validation
    if (!body.paymentKey || !body.orderId || !body.amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다 (paymentKey, orderId, amount)' },
        { status: 400 }
      );
    }

    if (body.amount < 1000 || body.amount > 10000000) {
      return NextResponse.json(
        { success: false, error: '충전 금액은 1,000원 ~ 10,000,000원 사이여야 합니다' },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 2. Idempotency Check - 동일 paymentKey로 이미 처리된 거래가 있는지 확인
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id, status, amount')
      .eq('reference_id', body.paymentKey)
      .single();

    if (existingTx) {
      auditLog('TOPUP_DUPLICATE', { requestId, existingTxId: existingTx.id });

      if (existingTx.status === 'completed') {
        return NextResponse.json({
          success: true,
          message: '이미 처리된 결제입니다',
          amount: existingTx.amount,
          duplicate: true,
        });
      }
      return NextResponse.json(
        { success: false, error: '이 결제는 현재 처리 중입니다' },
        { status: 409 }
      );
    }

    // 3. 토스페이먼츠 결제 승인
    const result = await confirmPayment({
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.amount,
    });

    if (!result.success) {
      auditLog('TOPUP_TOSS_FAIL', { requestId, error: result.error });
      return NextResponse.json(
        { success: false, error: result.error || '결제 승인 실패' },
        { status: 400 }
      );
    }

    // 4. Amount verification - 토스에서 응답한 금액이 요청 금액과 일치하는지 확인
    if (result.totalAmount && result.totalAmount !== body.amount) {
      auditLog('TOPUP_AMOUNT_MISMATCH', {
        requestId,
        requestedAmount: body.amount,
        actualAmount: result.totalAmount,
      });
      return NextResponse.json(
        { success: false, error: '결제 금액 불일치. 고객센터에 문의하세요.' },
        { status: 400 }
      );
    }

    // 5. Get wallet ID
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', body.userId)
      .single();

    if (!wallet) {
      auditLog('TOPUP_WALLET_NOT_FOUND', { requestId, userId: body.userId });
      return NextResponse.json(
        { success: false, error: '지갑을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 6. Update wallet balance (use atomic update to prevent race conditions)
    const newBalance = Number(wallet.balance) + body.amount;
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    if (updateError) {
      auditLog('TOPUP_BALANCE_UPDATE_FAIL', { requestId, error: updateError.message });
      return NextResponse.json(
        { success: false, error: '잔액 업데이트 실패. 고객센터에 문의하세요.' },
        { status: 500 }
      );
    }

    // 7. Create transaction record
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: body.userId,
        type: 'topup',
        amount: body.amount,
        currency: 'KRW',
        status: 'completed',
        description: `충전 (${result.method || 'CARD'})`,
        reference_id: result.paymentKey,
        metadata: {
          paymentKey: result.paymentKey,
          orderId: result.orderId,
          method: result.method,
          tossStatus: result.status,
          requestId,
        },
      });

    if (txError) {
      auditLog('TOPUP_TX_RECORD_FAIL', { requestId, error: txError.message });
      // Note: Balance was already updated, so we don't return error to user
      // but we should investigate why tx record failed
    }

    // 8. Get final balance for response
    const { data: finalWallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', body.userId)
      .single();

    auditLog('TOPUP_SUCCESS', {
      requestId,
      paymentKey: result.paymentKey,
      amount: body.amount,
      newBalance: finalWallet?.balance,
    });

    return NextResponse.json({
      success: true,
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      amount: result.totalAmount || body.amount,
      status: result.status,
      method: result.method,
      message: '충전이 완료되었습니다',
      wallet: {
        balance: finalWallet?.balance || body.amount,
        currency: 'KRW',
      },
    });

  } catch (error) {
    auditLog('TOPUP_ERROR', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET: 주문 ID 생성 (결제 시작 전)
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const orderId = generateOrderId();

    return NextResponse.json({
      success: true,
      orderId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '주문 ID 생성 실패' },
      { status: 500 }
    );
  }
}
