import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Subscription Webhook Route - 결제 웹훅 처리
 * 
 * 비즈니스 목적:
 * - Stripe/Toss Payments 웹훅 이벤트 처리
 * - 구독 상태 자동 업데이트
 * - 결제 성공/실패 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    logger.info('Subscription webhook received', { event, data });

    const supabase = await createClient();

    // 웹훅 이벤트 타입별 처리
    switch (event) {
      case 'subscription.created':
      case 'subscription.updated':
        // 구독 생성/업데이트
        if (data?.user_id && data?.plan_id) {
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: data.user_id,
              plan_id: data.plan_id,
              status: 'active',
              billing_cycle: data.billing_cycle || 'monthly',
              current_period_start: data.current_period_start,
              current_period_end: data.current_period_end,
              payment_provider: data.payment_provider || 'stripe',
              payment_id: data.payment_id,
            }, {
              onConflict: 'user_id',
            });
        }
        break;

      case 'subscription.cancelled':
        // 구독 취소
        if (data?.user_id) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'cancelled',
              cancel_at_period_end: true,
            })
            .eq('user_id', data.user_id);
        }
        break;

      case 'payment.succeeded':
        // 결제 성공
        if (data?.user_id) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
            })
            .eq('user_id', data.user_id);
        }
        break;

      case 'payment.failed':
        // 결제 실패
        if (data?.user_id) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('user_id', data.user_id);
        }
        break;

      default:
        logger.warn('Unknown webhook event', { event });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook processing error', { error: error.message });
    return NextResponse.json(
      { error: 'Webhook 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
