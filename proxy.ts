/**
 * Field Nine OS Proxy (formerly Middleware)
 * @version 3.0.0 - Phase 33: Sovereign Gate Security
 *
 * Features:
 * - SOVEREIGN GATE: CEO/Admin exclusive access control
 * - Subdomain routing: nexus.fieldnine.io, m.fieldnine.io
 * - i18n: 언어 감지 및 라우팅 (next-intl)
 * - Auth: Supabase 세션 관리 및 갱신
 * - Protected Routes: 인증 필요 경로 보호
 */

import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN GATE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const SOVEREIGN_COOKIE_NAME = 'sovereign-session';
const SOVEREIGN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Sovereign-protected routes (CEO/Admin only)
const sovereignRoutes = [
  '/panopticon',
  '/nexus-command',
  '/admin',
  '/dashboard/admin',
];

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
  '/dashboard/wallet',
  '/dashboard/settings',
  '/dashboard/profile',
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
  '/auth/sovereign',  // Sovereign login page itself
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');

  if (parts.length >= 3 && parts.slice(-2).join('.') === 'fieldnine.io') {
    const subdomain = parts[0];
    if (subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
}

/**
 * Validate Sovereign Session
 * Checks if the sovereign-session cookie contains valid hash
 */
function validateSovereignSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(SOVEREIGN_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return false;
  }

  // Get the passphrase from environment
  const sovereignPassphrase = process.env.SOVEREIGN_PASSPHRASE;

  if (!sovereignPassphrase) {
    console.warn('[Sovereign Gate] SOVEREIGN_PASSPHRASE not configured');
    return false;
  }

  // Simple hash comparison (in production, use proper crypto)
  // The cookie stores a base64 encoded signature
  const expectedHash = Buffer.from(sovereignPassphrase).toString('base64');

  return sessionCookie.value === expectedHash;
}

/**
 * Check if route requires Sovereign access
 */
function isSovereignRoute(pathWithoutLocale: string): boolean {
  return sovereignRoutes.some(route =>
    pathWithoutLocale === route ||
    pathWithoutLocale.startsWith(route + '/')
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROXY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Production 모니터링
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PROXY_LOG === 'true') {
    console.log(`[Proxy] ${request.method} ${pathname} from ${hostname}`);
  }

  // 스킵 경로 체크 (빠른 반환)
  if (skipPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Extract locale
  const locale = locales.find(
    l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  ) || defaultLocale;

  // Path without locale
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

  // ═══════════════════════════════════════════════════════════════════════════
  // SOVEREIGN GATE CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  if (isSovereignRoute(pathWithoutLocale)) {
    const isValidSession = validateSovereignSession(request);

    if (!isValidSession) {
      console.log(`[Sovereign Gate] Access denied to ${pathname} - redirecting to auth`);

      const sovereignLoginUrl = new URL(`/${locale}/auth/sovereign`, request.url);
      sovereignLoginUrl.searchParams.set('redirect', pathname);

      return NextResponse.redirect(sovereignLoginUrl);
    }

    // Valid sovereign session - allow access
    console.log(`[Sovereign Gate] Access granted to ${pathname}`);
  }

  // Root path redirect to Sovereign Landing
  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL(`/${defaultLocale}/sovereign`, request.url));
  }

  // Check for subdomain routing (nexus.fieldnine.io, m.fieldnine.io)
  const subdomain = getSubdomain(hostname);
  if (subdomain && SUBDOMAIN_ROUTES[subdomain]) {
    const targetPath = SUBDOMAIN_ROUTES[subdomain];
    const localeMatch = pathname.match(/^\/(ko|en|ja|zh)/);
    const extractedLocale = localeMatch ? localeMatch[1] : defaultLocale;
    const subdomainPath = pathname.replace(/^\/(ko|en|ja|zh)/, '') || '/';

    if (subdomainPath === '/' || subdomainPath === '') {
      const url = request.nextUrl.clone();
      url.pathname = `/${extractedLocale}${targetPath}`;
      return NextResponse.rewrite(url);
    }
  }

  // i18n 처리
  let response = intlMiddleware(request);

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
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('[Middleware] Auth error:', error.message);
      }

      // 보호된 라우트 + 미인증 → 로그인으로 리다이렉트
      if (isProtectedRoute && !user) {
        const loginUrl = new URL(`/${locale}/auth/login`, request.url);
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
     * - 정적 파일 (.ico, .svg, .png 등)
     */
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
