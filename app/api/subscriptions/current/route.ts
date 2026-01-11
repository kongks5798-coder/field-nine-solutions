import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 현재 구독 정보 조회 API
 * GET /api/subscriptions/current
 */

export async function GET(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 활성 구독 조회
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Subscription Current] 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '구독 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 정보에서도 구독 정보 확인
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      subscription: subscription || null,
      userPlan: userData?.subscription_plan || 'free',
      userStatus: userData?.subscription_status || 'inactive',
    });
  } catch (error: any) {
    console.error('[Subscription Current] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '구독 정보 조회 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
