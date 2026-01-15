/**
 * K-UNIVERSAL Ghost Wallet Top-up API
 * 토스페이먼츠 결제 승인 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, generateOrderId, type TossPaymentConfirm } from '@/lib/toss/client';

export const runtime = 'nodejs';

// ============================================
// POST: 결제 승인 처리 (토스 결제창 → 서버)
// ============================================

interface ConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ConfirmRequest = await request.json();

    // Validation
    if (!body.paymentKey || !body.orderId || !body.amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다 (paymentKey, orderId, amount)' },
        { status: 400 }
      );
    }

    if (body.amount < 1000) {
      return NextResponse.json(
        { success: false, error: '최소 충전 금액은 1,000원입니다' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인
    const result = await confirmPayment({
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.amount,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '결제 승인 실패' },
        { status: 400 }
      );
    }

    // TODO: 실제 환경에서는 여기서 DB에 결제 내역 저장
    // await supabase.from('wallet_transactions').insert({
    //   user_id: body.userId,
    //   payment_key: result.paymentKey,
    //   order_id: result.orderId,
    //   amount: result.totalAmount,
    //   status: result.status,
    //   method: result.method,
    // });

    return NextResponse.json({
      success: true,
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      amount: result.totalAmount,
      status: result.status,
      method: result.method,
      message: '충전이 완료되었습니다',
    });
  } catch (error) {
    console.error('Topup API error:', error);
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
