import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
// ⚠️  Vercel 서버리스는 인스턴스가 요청마다 다를 수 있어 이 Map은
//     단일 warm 인스턴스 내에서만 유효합니다 (1차 방어선 역할).
//     고트래픽 환경에서는 Upstash Redis(@upstash/ratelimit)로 교체 권장.
const RL_WINDOW_MS = 60_000;  // 1분
const RL_MAX_REQS  = 120;     // 분당 120 요청 (인스턴스 내)
const RL_API_MAX   = 30;      // API 경로 분당 30 요청 (인스턴스 내)

const rlMap = new Map<string, { count: number; resetAt: number }>();

// 만료된 엔트리 정리 — 메모리 누수 방지 (5분마다 실행)
let lastCleanup = 0;
function maybeCleanup(now: number) {
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rlMap) {
    if (entry.resetAt < now) rlMap.delete(key);
  }
}

function checkRateLimit(key: string, max: number): { ok: boolean; remaining: number; resetAt: number } {
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
    const rl = checkRateLimit(`api:${ip}`, RL_API_MAX);
    if (!rl.ok) {
      // audit_log: rate limit 초과 기록 (비동기 fire-and-forget)
      void writeAuditLog({ action: 'rate_limited', resource: pathname, ip, status_code: 429 });
      return new NextResponse(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(RL_API_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      });
    }
  }

  // 일반 요청 rate limit
  const globalRl = checkRateLimit(`global:${ip}`, RL_MAX_REQS);
  if (!globalRl.ok) {
    void writeAuditLog({ action: 'rate_limited', resource: pathname, ip, status_code: 429 });
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((globalRl.resetAt - Date.now()) / 1000)) },
    });
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

  return NextResponse.next();
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
