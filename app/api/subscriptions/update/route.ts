import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 구독 플랜 변경 API
 * POST /api/subscriptions/update
 * 
 * 현재 구독을 다른 플랜으로 변경
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
    const { subscriptionId, newPlanId, newPlanName, newAmount, newBillingCycle } = body;

    if (!subscriptionId || !newPlanId || !newPlanName || !newAmount) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 현재 구독 조회 및 소유권 확인
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, error: '구독을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '활성 구독만 변경할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 구독 플랜 업데이트
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: newPlanId,
        plan_name: newPlanName,
        amount: newAmount,
        billing_cycle: newBillingCycle || subscription.billing_cycle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('[Subscription Update] 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '구독 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 프로필 업데이트
    await supabase
      .from('users')
      .update({
        subscription_plan: newPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: '구독 플랜이 변경되었습니다.',
      subscription: {
        id: subscriptionId,
        planId: newPlanId,
        planName: newPlanName,
        amount: newAmount,
      },
    });
  } catch (error: any) {
    console.error('[Subscription Update] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '구독 변경 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
