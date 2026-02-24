// @vitest-environment node
/**
 * collab-route-extended.test.ts
 *
 * 기존 collab-route.test.ts에서 다루지 않는 추가 시나리오:
 * 1. GET 미인증 → 401
 * 2. POST 미인증 → 401
 * 3. POST 기존 세션 조회 시 DB 오류 → 500
 * 4. GET 기본 limit 적용 (파라미터 없음, 기본값 50)
 * 5. POST content 포함 새 세션 생성
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET, POST } from '@/app/api/collab/route';

const NO_SESSION = { data: { session: null } };
const AUTH_SESSION = { data: { session: { user: { id: 'u1' } } } };

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/collab');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/collab', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/collab (extended)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  // ── 1. 미인증 → 401 반환 ──────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 2. 기본 limit 적용 확인 (파라미터 없으면 50) ─────────────────────────
  it('limit 파라미터 없으면 기본값 50 적용', async () => {
    mockGetSession.mockResolvedValue(AUTH_SESSION);
    const limitFn = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: limitFn,
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    expect(limitFn).toHaveBeenCalledWith(50);
  });
});

describe('POST /api/collab (extended)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  // ── 3. 미인증 → 401 반환 ──────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq({ slug: 'test-doc' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 4. 기존 세션 조회 시 DB 오류 (throw) → 500 반환 ────────────────────────
  it('기존 세션 조회 시 DB 예외 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(AUTH_SESSION);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockRejectedValue(new Error('connection timeout')),
        }),
      }),
    });

    const res = await POST(makePostReq({ slug: 'error-doc' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('세션 생성 중 오류가 발생했습니다.');
  });

  // ── 5. content 포함 새 세션 생성 ──────────────────────────────────────────
  it('content 포함하여 새 세션 생성 → 201', async () => {
    mockGetSession.mockResolvedValue(AUTH_SESSION);
    const newSession = {
      id: '10',
      slug: 'content-doc',
      title: 'Content Doc',
      content: '# Hello World',
      owner_id: null,
      updated_at: '2024-03-01',
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // select → not found
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      // insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }),
        }),
      };
    });

    const res = await POST(makePostReq({
      slug: 'content-doc',
      title: 'Content Doc',
      content: '# Hello World',
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.session.content).toBe('# Hello World');
    expect(body.session.slug).toBe('content-doc');
  });
});
