/**
 * Field Nine OS Proxy (formerly Middleware)
 * @version 2.2.0 - Next.js 16 Compatible + Subdomain Routing
 *
 * Features:
 * - Subdomain routing: nexus.fieldnine.io, m.fieldnine.io
 * - i18n: 언어 감지 및 라우팅 (next-intl)
 * - Auth: Supabase 세션 관리 및 갱신
 * - Protected Routes: 인증 필요 경로 보호
 */

import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

// Subdomain routing configuration for Field Nine OS
const SUBDOMAIN_ROUTES: Record<string, string> = {
  'nexus': '/nexus',           // nexus.fieldnine.io → NEXUS-X Energy Dashboard
  'm': '/sovereign',           // m.fieldnine.io → Sovereign Empire Landing
};

// next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});

// 인증이 필요한 라우트
const protectedRoutes = [
  '/dashboard/admin',
  '/dashboard/wallet',
  '/dashboard/settings',
  '/dashboard/profile',
  '/admin',
  '/wallet',
  '/settings',
  '/profile',
  '/kyc',
];

// 인증 없이 접근 가능한 dashboard 하위 라우트
const publicDashboardRoutes = [
  '/dashboard',
  '/dashboard/hotels',
  '/dashboard/flights',
  '/dashboard/exchange',
  '/dashboard/airport',
];

// 로그인 상태면 리다이렉트되는 라우트
const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

// 완전히 스킵하는 경로
const skipPaths = [
  '/api',
  '/_next',
  '/auth/callback',
  '/panopticon',
  '/filluminate',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

// Helper function to extract subdomain
function getSubdomain(hostname: string): string | null {
  // Handle fieldnine.io domain
  const parts = hostname.split('.');

  if (parts.length >= 3 && parts.slice(-2).join('.') === 'fieldnine.io') {
    const subdomain = parts[0];
    // Treat 'www' as no subdomain
    if (subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const startTime = Date.now();

  // 스킵 경로 체크 (빠른 반환)
  if (skipPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Production 모니터링 (선택적)
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PROXY_LOG === 'true') {
    console.log(`[Proxy] ${request.method} ${pathname} from ${hostname}`);
  }

  // Root path redirect to Sovereign Landing
  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL(`/${defaultLocale}/sovereign`, request.url));
  }

  // Check for subdomain routing (nexus.fieldnine.io, m.fieldnine.io)
  // Only apply to root path - other paths pass through normally
  const subdomain = getSubdomain(hostname);
  if (subdomain && SUBDOMAIN_ROUTES[subdomain]) {
    const targetPath = SUBDOMAIN_ROUTES[subdomain];

    // Extract locale from path or use default
    const localeMatch = pathname.match(/^\/(ko|en|ja|zh)/);
    const locale = localeMatch ? localeMatch[1] : defaultLocale;
    const pathWithoutLocale = pathname.replace(/^\/(ko|en|ja|zh)/, '') || '/';

    // Only rewrite for root path (/ or just locale like /ko)
    // Allow all other paths to pass through normally
    if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${targetPath}`;
      return NextResponse.rewrite(url);
    }
  }

  // i18n 처리
  let response = intlMiddleware(request);

  // locale 추출
  const locale = locales.find(
    l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  ) || defaultLocale;

  // locale 제외한 경로
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

  // 공개 dashboard 라우트인지 확인
  const isPublicDashboardRoute = publicDashboardRoutes.some(route =>
    pathWithoutLocale === route || pathWithoutLocale === route + '/'
  );

  // 보호된 라우트 또는 인증 라우트인지 확인
  const isProtectedRoute = !isPublicDashboardRoute && protectedRoutes.some(route =>
    pathWithoutLocale.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route =>
    pathWithoutLocale.startsWith(route)
  );

  // 인증 체크가 필요한 경우만 Supabase 호출
  if (isProtectedRoute || isAuthRoute) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // 쿠키 설정 (세션 갱신)
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      // 세션 갱신 및 사용자 확인
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('[Middleware] Auth error:', error.message);
      }

      // 보호된 라우트 + 미인증 → 로그인으로 리다이렉트
      if (isProtectedRoute && !user) {
        const loginUrl = new URL(`/${locale}/auth/login`, request.url);
        // 로그인 후 원래 페이지로 돌아오기 위한 redirect 파라미터
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 인증 라우트 + 이미 로그인 → 대시보드로 리다이렉트
      if (isAuthRoute && user) {
        return NextResponse.redirect(
          new URL(`/${locale}/dashboard`, request.url)
        );
      }
    } catch (err) {
      console.error('[Middleware] Exception:', err);
      // 에러 발생 시에도 기본 응답 반환 (서비스 중단 방지)
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 다음 경로 제외:
     * - api (API routes)
     * - _next (Next.js internals)
     * - _vercel (Vercel internals)
     * - panopticon (별도 인증 시스템)
     * - 정적 파일 (.ico, .svg, .png 등)
     */
    '/((?!api|_next|_vercel|panopticon|filluminate|.*\\..*).*)',
  ],
};
