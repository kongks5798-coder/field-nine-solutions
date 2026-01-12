import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';
import { formatErrorResponse, logError, AppError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 추천 목록 조회 API
 * GET /api/recommendations/list?status=pending&limit=10
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const supabase = await createClient();

    let query = supabase
      .from('product_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      logError(error instanceof Error ? error : new Error(String(error)), { action: 'list_recommendations', userId: user.id });
      return NextResponse.json(
        { success: false, error: '추천 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 통계 계산
    const totalSavings = recommendations?.reduce(
      (sum, rec) => sum + (rec.estimated_savings || 0),
      0
    ) || 0;

    return NextResponse.json({
      success: true,
      recommendations: recommendations || [],
      total_count: recommendations?.length || 0,
      total_savings: totalSavings,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, { action: 'list_recommendations' });
    const errorResponse = formatErrorResponse(errorObj);
    const statusCode = errorObj instanceof AppError ? errorObj.statusCode : 500;
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
        code: errorResponse.code,
      },
      { status: statusCode }
    );
  }
}
