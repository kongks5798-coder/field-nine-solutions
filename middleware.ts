import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware - 인증 보호 및 세션 관리
 * 
 * 비즈니스 목적:
 * - 보호된 라우트 접근 제어
 * - 사용자 세션 자동 갱신
 * - 인증되지 않은 사용자 리다이렉트
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 라우트: /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // 로그인 페이지는 이미 로그인된 사용자를 대시보드로 리다이렉트
  if (request.nextUrl.pathname.startsWith('/auth/login')) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/login',
    '/auth/callback',
  ],
};
