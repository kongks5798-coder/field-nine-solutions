import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OAuth 콜백 - 서버에서 code 교환
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 에러 처리
  if (error) {
    console.error('[Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/ko/auth/login?error=${encodeURIComponent(errorDescription || error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/ko/auth/login?error=인증 코드가 없습니다', origin)
    );
  }

  const cookieStore = await cookies();
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  // 현재 쿠키 로깅
  const allCookies = cookieStore.getAll();
  console.log('[Callback] Current cookies:', allCookies.map(c => c.name));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    }
  );

  // 코드를 세션으로 교환
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[Callback] Exchange error:', exchangeError.message);
    return NextResponse.redirect(
      new URL(`/ko/auth/login?error=${encodeURIComponent(exchangeError.message)}`, origin)
    );
  }

  console.log('[Callback] Session created for:', data.user?.email);

  // 성공 - 대시보드로 이동
  const response = NextResponse.redirect(new URL('/ko/dashboard', origin));

  // 세션 쿠키 설정
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  });

  console.log('[Callback] Set cookies:', cookiesToSet.map(c => c.name));

  return response;
}
