/**
 * Dalkak Next.js Edge Middleware
 *
 * 모든 매칭 경로에 대해 다음 보안/운영 계층을 순차적으로 적용한다:
 *
 * 1. **CORS preflight** — `OPTIONS` 요청에 허용 헤더를 포함한 즉시 200 응답
 * 2. **경로별 API 레이트 리미팅** — `/api/` 경로에 IP 기반 차등 제한:
 *    - `/api/ai/*`      — 분당 30회 (비용이 높은 AI 호출)
 *    - `/api/billing/*`  — 분당 20회 (민감한 결제 경로)
 *    - `/api/auth/*`     — 분당 10회 (브루트포스 방지)
 *    - 기타 `/api/*`     — 분당 60회 (일반)
 *    Upstash Redis가 설정되면 분산 슬라이딩 윈도우 병행, 미설정 시 인메모리 폴백
 * 3. **글로벌 레이트 리미팅** — 모든 요청에 IP 기반 분당 120회 제한
 * 4. **인증 체크** — 보호 경로(`/workspace`, `/dashboard` 등)에 Supabase 세션 쿠키 검증.
 *    미인증 시 `/login?next=...`으로 리다이렉트
 * 5. **관리자 권한 검사** — `/admin` 경로에 `profiles.role === "admin"` 추가 확인.
 *    권한 없으면 홈(`/`)으로 리다이렉트하고 감사 로그 기록
 * 6. **CORS 헤더 주입** — API 응답에 `Access-Control-Allow-*` 헤더 추가
 * 7. **감사 로그** — 레이트 리미트 초과, 관리자 접근 거부 등 보안 이벤트를
 *    Supabase `audit_log` 테이블에 fire-and-forget으로 기록
 *
 * @see {@link config.matcher} 이 미들웨어가 적용되는 경로 패턴 목록
 *
 * @module
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { SITE_URL } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';
import type { RateLimitResult } from '@/lib/rate-limit';
import { rateLimitExceeded, applyRateLimitHeaders } from '@/lib/rate-limit-headers';

// ── Audit Log (fire-and-forget) ───────────────────────────────────────────────
interface AuditEntry {
  action: string;
  resource?: string;
  ip?: string;
  user_id?: string;
  status_code?: number;
  metadata?: Record<string, unknown>;
}

async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    await sb.from('audit_log').insert({
      action:      entry.action,
      resource:    entry.resource ?? null,
      ip:          entry.ip ?? null,
      user_id:     entry.user_id ?? null,
      status_code: entry.status_code ?? null,
      metadata:    entry.metadata ?? {},
    });
  } catch {
    // audit 실패는 요청 처리에 영향 없음
  }
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Upstash Redis가 설정된 경우 분산 Rate Limit 사용 (권장).
// 미설정 시 in-memory Map으로 폴백 (단일 Vercel 인스턴스 내에서만 유효).
const RL_MAX_REQS = 120; // 분당 120 요청 (글로벌)

// 경로별 API 제한값
const RL_API_AI      = 30;  // /api/ai/*      — AI 호출은 비용이 높음
const RL_API_BILLING = 20;  // /api/billing/*  — 민감한 결제 경로
const RL_API_AUTH    = 10;  // /api/auth/*     — 브루트포스 방지
const RL_API_DEFAULT = 60;  // 기타 /api/*     — 일반

// Upstash Redis 기반 Ratelimit (UPSTASH_REDIS_REST_URL 환경변수 설정 시 활성화)
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisRl = upstashUrl && upstashToken
  ? {
      global: new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RL_MAX_REQS, '1 m'),
        prefix: 'rl:global',
      }),
      apiAi: new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RL_API_AI, '1 m'),
        prefix: 'rl:api:ai',
      }),
      apiBilling: new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RL_API_BILLING, '1 m'),
        prefix: 'rl:api:billing',
      }),
      apiAuth: new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RL_API_AUTH, '1 m'),
        prefix: 'rl:api:auth',
      }),
      apiDefault: new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RL_API_DEFAULT, '1 m'),
        prefix: 'rl:api:default',
      }),
    }
  : null;

// In-memory 폴백 (단일 warm 인스턴스 내에서만 유효)
const RL_WINDOW_MS = 60_000;
const rlMap = new Map<string, { count: number; resetAt: number }>();

let lastCleanup = 0;
function maybeCleanup(now: number) {
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rlMap) {
    if (entry.resetAt < now) rlMap.delete(key);
  }
}

function checkRateLimitInMemory(key: string, max: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  maybeCleanup(now);
  let entry = rlMap.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + RL_WINDOW_MS };
    rlMap.set(key, entry);
  }
  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  return { ok: entry.count <= max, remaining, resetAt: entry.resetAt };
}

// ── 경로별 API rate-limit 설정 해석 ──────────────────────────────────────────
function getApiRateLimitConfig(pathname: string): { limit: number; windowMs: number; tier: string } {
  if (pathname.startsWith('/api/ai/'))      return { limit: RL_API_AI,      windowMs: RL_WINDOW_MS, tier: 'ai' };
  if (pathname.startsWith('/api/billing/')) return { limit: RL_API_BILLING, windowMs: RL_WINDOW_MS, tier: 'billing' };
  if (pathname.startsWith('/api/auth/'))    return { limit: RL_API_AUTH,    windowMs: RL_WINDOW_MS, tier: 'auth' };
  return                                    { limit: RL_API_DEFAULT,  windowMs: RL_WINDOW_MS, tier: 'default' };
}

function getUpstashApiLimiter(tier: string) {
  if (!redisRl) return null;
  switch (tier) {
    case 'ai':      return redisRl.apiAi;
    case 'billing': return redisRl.apiBilling;
    case 'auth':    return redisRl.apiAuth;
    default:        return redisRl.apiDefault;
  }
}

// ── 로그인 필요 경로 ──────────────────────────────────────────────────────────
const PROTECTED_PATHS = [
  '/workspace',
  '/dashboard',
  '/analytics',
  '/billing',
  '/cloud',
  '/cowork',
  '/team',
  '/settings',
  '/domains',
  '/gallery',
  '/ide',
  '/lab',
  '/lm',
  '/flow',
  '/collab',
  '/canvas',
];

const ADMIN_PATHS = ['/admin'];
const API_PATHS   = [
  '/api/ai/', '/api/projects/', '/api/tokens', '/api/billing/',
  '/api/admin/', '/api/cowork/', '/api/auth/', '/api/contact',
  '/api/analytics', '/api/published', '/api/domains/', '/api/lm/',
  '/api/billing/downgrade', '/api/billing/refund', '/api/projects/fork',
  '/api/collab/', '/api/flow/', '/api/lab/', '/api/canvas/', '/api/patrol/',
];

// ── CSP 참고 ─────────────────────────────────────────────────────────────────
// vercel.json CSP의 script-src에 'unsafe-eval' 포함됨.
// 이유: @tosspayments/tosspayments-sdk (결제 SDK)가 런타임 eval을 내부적으로 사용.
// TossPayments SDK를 제거하기 전까지 unsafe-eval 제거 불가.

// ── CORS 설정 ─────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
  'Access-Control-Max-Age':       '86400',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // OPTIONS preflight → 즉시 200 응답
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
  }

  // Vercel은 x-real-ip를 신뢰된 헤더로 제공. x-forwarded-for는 클라이언트 위조 가능.
  const ip =
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1';

  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAdmin     = ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isApi       = API_PATHS.some(p => pathname.startsWith(p));

  // ── 경로별 API 레이트 리미팅 (EARLY CHECK) ────────────────────
  // checkRateLimit (from @/lib/rate-limit) 를 인메모리 기본으로 사용하고,
  // Upstash Redis가 설정되면 분산 슬라이딩 윈도우도 병행 적용.
  let apiRateLimitResult: RateLimitResult | null = null;

  if (isApi) {
    const { limit, windowMs, tier } = getApiRateLimitConfig(pathname);

    // 1) 인메모리 rate limit via @/lib/rate-limit
    const memoryKey = `${ip}:${pathname}`;
    const memResult = checkRateLimit(memoryKey, { limit, windowMs });

    // 2) Upstash Redis (설정 시 분산 보호)
    const upstashLimiter = getUpstashApiLimiter(tier);
    if (upstashLimiter) {
      const { success, remaining, reset } = await upstashLimiter.limit(ip);
      if (!success) {
        void writeAuditLog({
          action: 'rate_limited',
          resource: pathname, ip, status_code: 429,
          metadata: { tier, limit },
        });
        return rateLimitExceeded({ success: false, limit, remaining, resetAt: reset });
      }
    }

    // 인메모리 결과로 차단 판정
    if (!memResult.success) {
      void writeAuditLog({
        action: 'rate_limited',
        resource: pathname, ip, status_code: 429,
        metadata: { tier, limit },
      });
      return rateLimitExceeded(memResult);
    }

    // 성공 시 나중에 응답 헤더에 추가하기 위해 결과 보관
    apiRateLimitResult = memResult;
  }

  // ── 글로벌 레이트 리미팅 (모든 요청) ──────────────────────────
  {
    let blocked = false;
    let retryAfterSec = 60;

    if (redisRl) {
      const { success, reset } = await redisRl.global.limit(ip);
      blocked = !success;
      retryAfterSec = Math.max(1, Math.ceil(reset / 1000) - Math.ceil(Date.now() / 1000));
    } else {
      const rl = checkRateLimitInMemory(`global:${ip}`, RL_MAX_REQS);
      blocked = !rl.ok;
      retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    }

    if (blocked) {
      void writeAuditLog({ action: 'rate_limited', resource: pathname, ip, status_code: 429 });
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSec) },
      });
    }
  }

  if (!isProtected && !isAdmin) {
    const res = NextResponse.next();
    if (apiRateLimitResult) {
      applyRateLimitHeaders(res, apiRateLimitResult);
    }
    if (pathname.startsWith('/api/')) {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    }
    return res;
  }

  // 세션 쿠키 기반 인증 체크 (Supabase SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', pathname);

  let session;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch {
    // Supabase 호출 실패 시 보안상 로그인 페이지로 리다이렉트
    return NextResponse.redirect(loginUrl);
  }

  if (!session) {
    return NextResponse.redirect(loginUrl);
  }

  // 어드민 경로: 추가로 admin 역할 검사
  if (isAdmin) {
    const adminSb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { data: profile } = await adminSb
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      void writeAuditLog({
        action: 'admin.access.denied',
        resource: pathname,
        ip,
        user_id: session.user.id,
        status_code: 403,
      });
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  const res = NextResponse.next();
  // API 응답에 rate-limit 헤더 추가
  if (apiRateLimitResult) {
    applyRateLimitHeaders(res, apiRateLimitResult);
  }
  // API 응답에 CORS 헤더 추가
  if (pathname.startsWith('/api/')) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  }
  return res;
}

export const config = {
  matcher: [
    '/workspace/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/billing/:path*',
    '/cloud/:path*',
    '/cowork/:path*',
    '/team/:path*',
    '/settings/:path*',
    '/domains/:path*',
    '/gallery/:path*',
    '/ide/:path*',
    '/lab/:path*',
    '/lm/:path*',
    '/flow/:path*',
    '/collab/:path*',
    '/canvas/:path*',
    '/admin/:path*',
    '/api/ai/:path*',
    '/api/projects/:path*',
    '/api/tokens/:path*',
    '/api/billing/:path*',
    '/api/admin/:path*',
    '/api/cowork/:path*',
    '/api/auth/:path*',
    '/api/contact',
    '/api/analytics',
    '/api/published',
    '/api/domains/:path*',
    '/api/lm/:path*',
    '/api/collab/:path*',
    '/api/flow/:path*',
    '/api/lab/:path*',
    '/api/canvas/:path*',
    '/api/patrol/:path*',
  ],
};
