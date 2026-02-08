/**
 * Early Access API
 * 사전등록 이메일 수집
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client (서버 사이드)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, platform = 'both', locale = 'ko', source = 'landing' } = body;

    // 이메일 유효성 검사
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // UTM 파라미터 추출
    const url = new URL(request.url);
    const utm_source = url.searchParams.get('utm_source') || null;
    const utm_medium = url.searchParams.get('utm_medium') || null;
    const utm_campaign = url.searchParams.get('utm_campaign') || null;

    // Supabase에 저장
    const { data, error } = await supabase
      .from('early_access')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          platform,
          locale,
          source,
          utm_source,
          utm_medium,
          utm_campaign,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      console.error('[Early Access] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to register' },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'Successfully registered for early access',
      data: { id: data.id },
    });
  } catch (err) {
    console.error('[Early Access] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 등록 수 조회 (공개 통계용)
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('early_access')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
