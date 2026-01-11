import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 구독 갱신 API
 * POST /api/subscriptions/renew
 * 
 * 만료 예정인 구독을 자동 갱신하거나 수동 갱신
 */

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, autoRenew = true } = body;

    const supabase = await createClient();

    // 현재 활성 구독 조회
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subscriptionId) {
      query = query.eq('id', subscriptionId);
    }

    const { data: subscription, error: fetchError } = await query.single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, error: '활성 구독을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 만료일 계산
    const expiresAt = subscription.expires_at 
      ? new Date(subscription.expires_at)
      : new Date();
    
    // 갱신 기간 추가 (월간/연간)
    const renewalPeriod = subscription.billing_cycle === 'yearly' ? 365 : 30;
    expiresAt.setDate(expiresAt.getDate() + renewalPeriod);

    // 구독 갱신
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        expires_at: expiresAt.toISOString(),
        auto_renew: autoRenew,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Subscription Renew] 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '구독 갱신에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '구독이 갱신되었습니다.',
      subscription: {
        id: subscription.id,
        expiresAt: expiresAt.toISOString(),
        autoRenew: autoRenew,
      },
    });
  } catch (error: any) {
    console.error('[Subscription Renew] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '구독 갱신 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
