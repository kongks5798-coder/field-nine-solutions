import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';
import { formatErrorResponse, logError } from '@/lib/error-handler';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Toss Payments 웹훅 처리
 * POST /api/payments/webhook
 * 
 * 결제 성공/실패 시 Toss Payments에서 호출
 */

interface WebhookPayload {
  eventType: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    totalAmount: number;
    approvedAt?: string;
    failedAt?: string;
    failReason?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json();
    const { eventType, data } = body;

    // 웹훅 서명 검증 (프로덕션에서는 필수)
    const signature = request.headers.get('x-toss-signature');
    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
    
    if (secretKey && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(JSON.stringify(body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('[Payment Webhook] 서명 검증 실패');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const supabase = await createClient();

    // orderId에서 subscription ID 추출
    // orderId 형식: subscription-{id}-{timestamp}
    const orderIdMatch = data.orderId.match(/^subscription-(\d+)-/);
    if (!orderIdMatch) {
      console.error('[Payment Webhook] 잘못된 orderId 형식:', data.orderId);
      return NextResponse.json(
        { success: false, error: 'Invalid orderId format' },
        { status: 400 }
      );
    }

    const subscriptionId = orderIdMatch[1];

    // 이벤트 타입에 따라 처리
    if (eventType === 'PAYMENT_CONFIRMED' || data.status === 'DONE') {
      // 결제 성공
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_id: data.paymentKey,
          activated_at: data.approvedAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('[Payment Webhook] 구독 업데이트 오류:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      // 사용자 프로필에 구독 정보 업데이트
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('user_id, plan_id, plan_name, billing_cycle')
        .eq('id', subscriptionId)
        .single();

      if (subscription) {
        await supabase
          .from('users')
          .update({
            subscription_plan: subscription.plan_id,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.user_id);
      }

      return NextResponse.json({ success: true, message: 'Payment confirmed' });
    } else if (eventType === 'PAYMENT_FAILED' || data.status === 'FAILED') {
      // 결제 실패
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'failed',
          payment_id: data.paymentKey,
          failed_at: data.failedAt || new Date().toISOString(),
          fail_reason: data.failReason || 'Payment failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('[Payment Webhook] 구독 업데이트 오류:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Payment failed recorded' });
    } else if (eventType === 'PAYMENT_CANCELED' || data.status === 'CANCELED') {
      // 결제 취소
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('[Payment Webhook] 구독 업데이트 오류:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Payment canceled recorded' });
    }

    // 알 수 없는 이벤트 타입
    console.warn('[Payment Webhook] 알 수 없는 이벤트 타입:', eventType);
    return NextResponse.json({ success: true, message: 'Event type not handled' });
  } catch (error: any) {
    console.error('[Payment Webhook] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '웹훅 처리 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
