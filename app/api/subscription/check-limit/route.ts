import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAnalysis } from '@/lib/subscription-trendstream';

/**
 * Check Limit Route - 분석 가능 여부 확인
 * 
 * 비즈니스 목적:
 * - 분석 실행 전 사용량 제한 확인
 * - 사용자에게 명확한 제한 안내
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

    // 분석 가능 여부 확인
    const check = await canPerformAnalysis(user.id);

    return NextResponse.json(check);
  } catch (error: any) {
    console.error('Check limit error:', error);
    return NextResponse.json(
      { error: '사용량 확인에 실패했습니다.' },
      { status: 500 }
    );
  }
}
