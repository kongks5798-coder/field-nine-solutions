import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 구독 목록 조회 API
 * GET /api/subscriptions/list
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'all', 'active', 'cancelled', 'expired'

    // 구독 조회
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('[Subscription List] 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '구독 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      count: subscriptions?.length || 0,
    });
  } catch (error: any) {
    console.error('[Subscription List] 예상치 못한 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '구독 목록 조회 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
