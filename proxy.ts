/**
 * Field Nine OS Proxy (formerly Middleware)
 * @version 4.0.0 - Phase 78: Security & Rate Limiting
 *
 * Features:
 * - SOVEREIGN GATE: CEO/Admin exclusive access control
 * - Subdomain routing: nexus.fieldnine.io, m.fieldnine.io
 * - i18n: 언어 감지 및 라우팅 (next-intl)
 * - Auth: Supabase 세션 관리 및 갱신
 * - Protected Routes: 인증 필요 경로 보호
 * - RATE LIMITING: API endpoint protection against brute force
 * - SECURITY HEADERS: XSS, Clickjacking protection
 */

import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 79: IMPERIAL GUARD - RATE LIMITING & DDoS PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// DDoS tracking: IP -> { requests: timestamp[], blocked: boolean, blockedUntil: number }
const ddosStore = new Map<string, {
  requests: number[];
  blocked: boolean;
  blockedUntil: number;
}>();

// Blocked IPs (in-memory for session)
const blockedIPs = new Set<string>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },     // 5 per 15 min
  payment: { maxRequests: 10, windowMs: 60 * 1000 },     // 10 per min
  sensitive: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  api: { maxRequests: 100, windowMs: 60 * 1000 },        // 100 per min
};

// DDoS Configuration
const DDOS_CONFIG = {
  requestsPerSecond: 50,     // Max requests per second per IP
  blockDuration: 300000,     // 5 minutes block
};

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count };
}

function getRateLimitType(pathname: string): keyof typeof RATE_LIMITS {
  if (pathname.startsWith('/api/auth/')) return 'auth';
  if (pathname.startsWith('/api/payment/') || pathname.includes('/buy') || pathname.includes('/purchase') || pathname.includes('/withdraw')) return 'payment';
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/api/kyc/')) return 'sensitive';
  return 'api';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 79: DDoS DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function checkDDoS(ip: string): { allowed: boolean; threat: boolean } {
  const now = Date.now();
  const oneSecondAgo = now - 1000;

  // Check if permanently blocked
  if (blockedIPs.has(ip)) {
    return { allowed: false, threat: true };
  }

  let record = ddosStore.get(ip);

  if (!record) {
    record = { requests: [], blocked: false, blockedUntil: 0 };
    ddosStore.set(ip, record);
  }

  // Check if currently blocked
  if (record.blocked) {
    if (now < record.blockedUntil) {
      return { allowed: false, threat: true };
    }
    // Unblock
    record.blocked = false;
    record.requests = [];
  }

  // Filter old requests (keep only last second)
  record.requests = record.requests.filter((t) => t > oneSecondAgo);

  // Add current request
  record.requests.push(now);

  // Check for DDoS pattern
  if (record.requests.length > DDOS_CONFIG.requestsPerSecond) {
    record.blocked = true;
    record.blockedUntil = now + DDOS_CONFIG.blockDuration;

    console.warn(`[IMPERIAL GUARD] 🚨 DDoS detected: ${ip} - ${record.requests.length} req/sec`);

    return { allowed: false, threat: true };
  }

  return { allowed: true, threat: false };
}

// Cleanup old DDoS entries periodically
function cleanupDDoSStore() {
  const now = Date.now();
  for (const [ip, record] of ddosStore.entries()) {
    if (!record.blocked && record.requests.length === 0) {
      ddosStore.delete(ip);
    } else if (record.blocked && now > record.blockedUntil) {
      record.blocked = false;
      record.requests = [];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  );
  return response;
}

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
  // 'm' subdomain now shows the main PHASE 64 landing page (app/[locale]/page.tsx)
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

// 완전히 스킵하는 경로 (i18n 및 인증 처리 제외)
const skipPaths = [
  '/_next',
  '/auth/callback',
  '/auth/sovereign',  // Sovereign login page itself
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
  '/vrd',             // VRD 26SS E-commerce (standalone, no i18n)
];

// Sensitive API paths for stricter rate limiting
const SENSITIVE_API_PATHS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/sovereign',
  '/api/kaus/withdraw',
  '/api/kaus/buy',
  '/api/kaus/purchase',
  '/api/payment/',
  '/api/admin/',
  '/api/kyc/',
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 79: IMPERIAL GUARD - DDoS & RATE LIMITING
  // ═══════════════════════════════════════════════════════════════════════════

  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(request);

    // DDoS Check first
    const ddosCheck = checkDDoS(ip);
    if (!ddosCheck.allowed) {
      console.warn(`[IMPERIAL GUARD] Blocked DDoS attack from ${ip}`);

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Access Denied',
          message: '비정상적인 트래픽이 감지되었습니다. 잠시 후 다시 시도해주세요.',
          code: 'DDOS_BLOCKED',
          retryAfter: Math.ceil(DDOS_CONFIG.blockDuration / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-Imperial-Guard': 'DDOS_BLOCKED',
            'Retry-After': String(Math.ceil(DDOS_CONFIG.blockDuration / 1000)),
          },
        }
      );
    }

    // Rate Limiting Check
    const rateLimitType = getRateLimitType(pathname);
    const config = RATE_LIMITS[rateLimitType];
    const key = `${rateLimitType}:${ip}:${pathname}`;

    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      console.log(`[Rate Limit] Blocked: ${ip} on ${pathname}`);

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too Many Requests',
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-Imperial-Guard': 'RATE_LIMITED',
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Periodic cleanup (every ~1000 requests)
    if (Math.random() < 0.001) {
      cleanupDDoSStore();
    }

    // API routes pass through with rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-Imperial-Guard', 'ACTIVE');
    return addSecurityHeaders(response);
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

  // PHASE 64: Root path now shows the main MUSINSA-grade landing page
  // The intlMiddleware will handle redirecting '/' to '/{locale}' which serves app/[locale]/page.tsx

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

  return addSecurityHeaders(response);
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
