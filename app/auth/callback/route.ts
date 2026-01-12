import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * Auth Callback Route - Supabase 인증 콜백 처리
 * 
 * 비즈니스 목적:
 * - 이메일 인증 후 리다이렉트 처리
 * - 소셜 로그인 콜백 처리
 * - 사용자를 대시보드로 안전하게 이동
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 인증 완료 후 대시보드로 리다이렉트
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
