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

    // 3. Get wallet ID
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', body.userId)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: '지갑을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. Update wallet balance
    const newBalance = Number(wallet.balance) + body.amount;
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    // 5. Create transaction record
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
        },
      });

    if (txError) {
      console.error('거래 기록 저장 실패:', txError);
    }

    // 6. Get final balance
    const { data: finalWallet } = await supabaseAdmin
      .from('wallets')
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
