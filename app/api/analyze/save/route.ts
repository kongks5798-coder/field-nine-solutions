import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Save Analysis Route - 분석 결과 Supabase 저장
 * 
 * 비즈니스 목적:
 * - 사용자의 분석 히스토리 저장
 * - 나중에 조회 가능하도록 데이터 보존
 * - 개인화된 서비스 제공
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { hashtag, platform, colors, items, confidence, analyzed_posts } = body;

    if (!hashtag || !colors || !items) {
      return NextResponse.json(
        { error: '필수 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 분석 결과 저장
    const { data, error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: user.id,
        hashtag,
        platform: platform || 'instagram',
        top_colors: colors,
        top_items: items,
        confidence: confidence || 0.85,
        analyzed_posts: analyzed_posts || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: '분석 결과 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error: any) {
    console.error('Save analysis error:', error);
    return NextResponse.json(
      { error: '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
