/**
 * K-UNIVERSAL Ghost Wallet Top-up API
 * 토스페이먼츠 결제 승인 + DB 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, generateOrderId } from '@/lib/toss/client';
import { supabaseAdmin } from '@/lib/supabase/server';

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ConfirmRequest = await request.json();

    // 1. Validation
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

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 2. 토스페이먼츠 결제 승인
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

    // 3. DB에 결제 기록 저장
    const { error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: body.userId,
        payment_key: result.paymentKey,
        order_id: result.orderId,
        amount: result.totalAmount || body.amount,
        status: result.status || 'DONE',
        method: result.method || 'CARD',
      });

    if (paymentError) {
      console.error('결제 기록 저장 실패:', paymentError);
    }

    // 4. 지갑 잔액 업데이트
    const { data: existingWallet } = await supabaseAdmin
      .from('user_wallets')
      .select('balance')
      .eq('user_id', body.userId)
      .single();

    if (existingWallet) {
      await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: existingWallet.balance + body.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', body.userId);
    } else {
      await supabaseAdmin
        .from('user_wallets')
        .insert({
          user_id: body.userId,
          balance: body.amount,
          currency: 'KRW',
        });
    }

    // 5. 최종 지갑 잔액 조회
    const { data: finalWallet } = await supabaseAdmin
      .from('user_wallets')
      .select('balance')
      .eq('user_id', body.userId)
      .single();

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
