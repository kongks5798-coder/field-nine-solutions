/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS-X SOVEREIGN MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Global routing and locale handling for the Sovereign Empire
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBDOMAIN ROUTING
  // ═══════════════════════════════════════════════════════════════════════════

  // m.fieldnine.io → Sovereign Landing Page
  if (hostname === 'm.fieldnine.io' || hostname === 'www.fieldnine.io' || hostname === 'fieldnine.io') {
    // Root path → Redirect to /ko/sovereign
    if (pathname === '/' || pathname === '') {
      return NextResponse.redirect(new URL('/ko/sovereign', request.url));
    }
    // If already has locale prefix, let it through
    if (pathname.startsWith('/ko') || pathname.startsWith('/en')) {
      return intlMiddleware(request);
    }
    // Add default locale
    return NextResponse.redirect(new URL(`/ko${pathname}`, request.url));
  }

  // nexus.fieldnine.io → NEXUS Portal
  if (hostname === 'nexus.fieldnine.io') {
    if (pathname === '/' || pathname === '') {
      return NextResponse.redirect(new URL('/ko/nexus', request.url));
    }
    if (!pathname.startsWith('/ko') && !pathname.startsWith('/en')) {
      return NextResponse.redirect(new URL(`/ko${pathname}`, request.url));
    }
  }

  // api.fieldnine.io → API Routes (no locale needed)
  if (hostname === 'api.fieldnine.io') {
    if (!pathname.startsWith('/api')) {
      return NextResponse.rewrite(new URL(`/api${pathname}`, request.url));
    }
    return NextResponse.next();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT ROUTING
  // ═══════════════════════════════════════════════════════════════════════════

  // Skip API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Root path → Redirect to /ko/sovereign for main domain
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ko/sovereign', request.url));
  }

  // Apply next-intl middleware for locale handling
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except static files and API
  matcher: [
    '/',
    '/(ko|en|ja|zh)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
