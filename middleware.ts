import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

/**
 * K-Universal Middleware
 * - i18n: 언어 감지 및 라우팅
 * - Auth: 인증 보호 및 세션 관리
 */

// next-intl middleware 생성
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // 항상 언어 코드를 URL에 포함
  localeDetection: false, // 브라우저 언어 감지 비활성화 - 무조건 한국어(ko)로 시작
});

// Protected routes that require authentication
// ⚠️ TEMP: Auth bypass for UI inspection - REMOVE BEFORE PRODUCTION
const AUTH_BYPASS = true; // Set to false to re-enable auth protection
const protectedRoutes = AUTH_BYPASS ? [] : ['/dashboard', '/admin'];

// Auth routes that redirect if already logged in
const authRoutes = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle i18n routing first
  const intlResponse = intlMiddleware(request);

  // Extract locale from the path (e.g., /en/dashboard -> en)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Get the path without locale prefix for auth checks
  let pathWithoutLocale = pathname;
  if (pathnameHasLocale) {
    const locale = locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    );
    if (locale) {
      pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    }
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  // Check if this is an auth route
  const isAuthRoute = authRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  // If route requires auth check, verify with Supabase
  if (isProtectedRoute || isAuthRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              intlResponse.cookies.set(name, value);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Extract locale for redirect URLs
    const locale = locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    ) || defaultLocale;

    // Protected route but not authenticated -> redirect to login
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login`, request.url)
      );
    }

    // Auth route but already authenticated -> redirect to dashboard
    if (isAuthRoute && user) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url)
      );
    }
  }

  return intlResponse;
}

export const config = {
  // Match all pathnames except for API, static files, and _next
  matcher: [
    // Match all pathnames except those starting with:
    // - api (API routes)
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - Files with extensions (.ico, .svg, etc.)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
