/**
 * Auth Callback Route Handler
 * PKCE Flow: code를 session으로 교환
 * @version 2.0.0 - Production Grade
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/ko/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // 에러 파라미터가 있는 경우 (사용자가 로그인 취소 등)
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    const errorMessage = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(
      new URL(`/ko/auth/login?error=${errorMessage}`, requestUrl.origin)
    );
  }

  // code가 없는 경우
  if (!code) {
    console.error('[Auth Callback] No code provided');
    return NextResponse.redirect(
      new URL('/ko/auth/login?error=인증 코드가 없습니다', requestUrl.origin)
    );
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // PKCE: code를 session으로 교환
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError.message);
      const errorMessage = encodeURIComponent(exchangeError.message);
      return NextResponse.redirect(
        new URL(`/ko/auth/login?error=${errorMessage}`, requestUrl.origin)
      );
    }

    if (!data.session) {
      console.error('[Auth Callback] No session returned');
      return NextResponse.redirect(
        new URL('/ko/auth/login?error=세션 생성 실패', requestUrl.origin)
      );
    }

    // 성공: 원래 가려던 페이지로 리다이렉트
    console.log('[Auth Callback] Success, redirecting to:', next);

    // next 경로 검증 (보안: 외부 URL 방지)
    const safeNext = next.startsWith('/') ? next : '/ko/dashboard';

    return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  } catch (err) {
    console.error('[Auth Callback] Exception:', err);
    return NextResponse.redirect(
      new URL('/ko/auth/login?error=인증 처리 중 오류가 발생했습니다', requestUrl.origin)
    );
  }
}
