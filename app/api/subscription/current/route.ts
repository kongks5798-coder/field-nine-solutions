import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSubscription, getCurrentUsage } from '@/lib/subscription-trendstream';

/**
 * Current Subscription Route - 현재 구독 정보 조회
 * 
 * 비즈니스 목적:
 * - 사용자의 현재 구독 상태 확인
 * - 사용량 정보 제공
 * - 플랜 업그레이드 유도
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 구독 정보 조회
    const subscription = await getCurrentSubscription(user.id);
    const usage = await getCurrentUsage(user.id);

    return NextResponse.json({
      subscription: subscription || {
        plan_id: 'free',
        status: 'active',
      },
      usage,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: '구독 정보 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
