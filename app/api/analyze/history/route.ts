import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Analysis History Route - 분석 히스토리 조회
 * 
 * 비즈니스 목적:
 * - 사용자의 과거 분석 결과 조회
 * - 트렌드 변화 추적
 * - 개인화된 대시보드 제공
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 분석 히스토리 조회
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase select error:', error);
      return NextResponse.json(
        { error: '히스토리 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
