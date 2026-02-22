import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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
const RL_MAX_REQS = 120; // 분당 120 요청
const RL_API_MAX  = 30;  // API 경로 분당 30 요청

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
      api: new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(RL_API_MAX, '1 m'),
        prefix: 'rl:api',
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

// ── 로그인 필요 경로 ──────────────────────────────────────────────────────────
const PROTECTED_PATHS = [
  '/workspace',
  '/analytics',
  '/billing',
  '/cloud',
  '/cowork',
  '/team',
  '/settings',
  '/domains',
  '/gallery',
];

const ADMIN_PATHS = ['/admin'];
const API_PATHS   = ['/api/ai/', '/api/projects/', '/api/tokens', '/api/billing/', '/api/admin/'];

// ── CORS 설정 ─────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.NEXT_PUBLIC_APP_URL ?? 'https://fieldnine.io',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
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

  // API 엔드포인트 rate limit
  if (isApi) {
    let blocked = false;
    let retryAfterSec = 60;
    let remaining = 0;
    let resetUnix = Math.ceil((Date.now() + 60_000) / 1000);

    if (redisRl) {
      // Upstash Redis: 분산 sliding window (모든 Vercel 인스턴스 공유)
      const { success, remaining: rem, reset } = await redisRl.api.limit(ip);
      blocked = !success;
      remaining = rem;
      resetUnix = Math.ceil(reset / 1000);
      retryAfterSec = Math.max(1, resetUnix - Math.ceil(Date.now() / 1000));
    } else {
      // In-memory 폴백
      const rl = checkRateLimitInMemory(`api:${ip}`, RL_API_MAX);
      blocked = !rl.ok;
      remaining = rl.remaining;
      resetUnix = Math.ceil(rl.resetAt / 1000);
      retryAfterSec = Math.max(1, resetUnix - Math.ceil(Date.now() / 1000));
    }

    if (blocked) {
      void writeAuditLog({ action: 'rate_limited', resource: pathname, ip, status_code: 429 });
      return new NextResponse(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(RL_API_MAX),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(resetUnix),
        },
      });
    }
  }

  // 일반 요청 rate limit
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

  if (!isProtected && !isAdmin) return NextResponse.next();

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

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
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
  // API 응답에 CORS 헤더 추가
  if (pathname.startsWith('/api/')) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  }
  return res;
}

export const config = {
  matcher: [
    '/workspace/:path*',
    '/analytics/:path*',
    '/billing/:path*',
    '/cloud/:path*',
    '/cowork/:path*',
    '/team/:path*',
    '/settings/:path*',
    '/domains/:path*',
    '/gallery/:path*',
    '/admin/:path*',
    '/api/ai/:path*',
    '/api/projects/:path*',
    '/api/tokens/:path*',
    '/api/billing/:path*',
    '/api/admin/:path*',
  ],
};
