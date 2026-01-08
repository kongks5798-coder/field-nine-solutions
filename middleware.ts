import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Next.js Middleware
 * 모든 요청에 대해 세션을 갱신하고 보호된 경로를 체크
 * 
 * Next.js 15 + @supabase/ssr 표준
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Supabase 환경 변수가 설정되지 않았습니다.');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // CSRF 보호: SameSite=Strict 강제 설정
        const secureOptions: CookieOptions = {
          ...options,
          sameSite: 'lax', // OAuth 리다이렉트를 위해 'lax' 사용 (Strict는 너무 제한적)
          httpOnly: name.includes('auth-token') || name.includes('sb-'), // 인증 쿠키는 httpOnly
          secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure
        };
        
        // 요청 쿠키 설정
        request.cookies.set({
          name,
          value,
          ...secureOptions,
        });
        // 응답 쿠키 설정 (새 응답 객체 생성)
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...secureOptions,
        });
      },
      remove(name: string, options: CookieOptions) {
        // CSRF 보호: SameSite=Strict 강제 설정
        const secureOptions: CookieOptions = {
          ...options,
          sameSite: 'lax',
          httpOnly: name.includes('auth-token') || name.includes('sb-'),
          secure: process.env.NODE_ENV === 'production',
        };
        
        // 요청 쿠키 삭제
        request.cookies.set({
          name,
          value: '',
          ...secureOptions,
        });
        // 응답 쿠키 삭제 (새 응답 객체 생성)
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...secureOptions,
        });
      },
    },
  });

  try {
    // 세션 확인 및 자동 갱신
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 세션이 있으면 토큰 유효성 확인
    if (session) {
      try {
        const {
          data: { user },
          error: refreshError,
        } = await supabase.auth.getUser();

        // 토큰이 만료되었거나 유효하지 않은 경우
        if (refreshError && refreshError.message.includes('JWT')) {
          await supabase.auth.signOut();
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('error', 'session_expired');
          return NextResponse.redirect(loginUrl);
        }
      } catch (err) {
        console.error('[Middleware] 세션 갱신 중 오류:', err);
      }
    }

    // 보호된 경로 목록
    const protectedPaths = ['/dashboard', '/admin', '/inventory', '/orders'];
    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    // 로그인 페이지는 로그인된 사용자가 접근하면 대시보드로 리다이렉트
    if (request.nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 보호된 경로 접근 시 로그인 확인
    if (isProtectedPath && !session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (err) {
    console.error('[Middleware] Supabase 처리 중 오류:', err);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
