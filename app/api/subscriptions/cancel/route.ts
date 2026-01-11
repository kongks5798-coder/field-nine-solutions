import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 구독 취소 API
 * POST /api/subscriptions/cancel
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
    const { subscriptionId, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: '구독 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 구독 조회 및 소유권 확인
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

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '이미 취소된 구독입니다.' },
        { status: 400 }
      );
    }

    // 구독 취소 처리
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        cancel_reason: reason || '사용자 요청',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('[Subscription Cancel] 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '구독 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 프로필 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다.',
      subscription: {
        id: subscriptionId,
        status: 'cancelled',
      },
    });
  } catch (error: any) {
    console.error('[Subscription Cancel] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '구독 취소 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
