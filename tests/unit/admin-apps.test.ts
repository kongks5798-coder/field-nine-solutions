// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import { GET, DELETE } from '@/app/api/admin/apps/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK   = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin/apps');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

function makeDeleteReq(slug?: string) {
  const url = new URL('http://localhost/api/admin/apps');
  if (slug) url.searchParams.set('slug', slug);
  return new NextRequest(url, { method: 'DELETE' });
}

// ── 샘플 데이터 ─────────────────────────────────────────────────────────────
const SAMPLE_APPS = [
  {
    slug: 'my-cool-app',
    name: '쿨한 앱',
    views: 120,
    user_id: 'u1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
    profiles: { email: 'user@test.com', plan: 'pro' },
  },
  {
    slug: 'another-app',
    name: '다른 앱',
    views: 50,
    user_id: 'u2',
    created_at: '2025-02-01T00:00:00Z',
    updated_at: null,
    profiles: { email: 'free@test.com', plan: null },
  },
];

// ── GET 쿼리 체인 모킹 ──────────────────────────────────────────────────────
// 실제 체인: select() → range() → [or()] → order()  (Promise-like 최종)
function mockAppsQuery(data: unknown[], count: number, error: { message: string } | null = null) {
  const result = { data: error ? null : data, error: error ?? null, count };

  // order() 는 최종 thenable
  const orderResult = { then: (resolve: (v: typeof result) => void) => resolve(result) };
  // or() → order()
  const orResult    = { order: vi.fn().mockReturnValue(orderResult) };
  // range() 결과: or / order 모두 지원 (search 유무에 따라)
  const rangeResult = {
    or:    vi.fn().mockReturnValue(orResult),
    order: vi.fn().mockReturnValue(orderResult),
  };
  // select() → range()
  const selectResult = { range: vi.fn().mockReturnValue(rangeResult) };

  return () => ({ select: vi.fn().mockReturnValue(selectResult) });
}

// ── DELETE 체인 모킹 ────────────────────────────────────────────────────────
// comments: delete().eq()  → 완료
// likes:    delete().eq()  → 완료
// published_apps: delete().eq() → { error }
function mockDeleteChain(deleteError: { message: string } | null = null) {
  const eqOk = { then: (resolve: (v: { error: null }) => void) => resolve({ error: null }) };
  const eqErr = { then: (resolve: (v: { error: typeof deleteError }) => void) => resolve({ error: deleteError }) };

  let callCount = 0;
  return () => {
    callCount++;
    if (callCount <= 2) {
      // app_comments, app_likes 삭제 (항상 성공)
      return { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqOk) }) };
    }
    // published_apps 삭제
    return { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(deleteError ? eqErr : eqOk) }) };
  };
}

// ── GET 테스트 ────────────────────────────────────────────────────────────
describe('GET /api/admin/apps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('정상 요청 → 200 + 앱 목록 반환', async () => {
    mocks.mockFrom.mockImplementation(mockAppsQuery(SAMPLE_APPS, 2));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.apps)).toBe(true);
    expect(body.total).toBe(2);
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(50);
  });

  it('limit 최대값 200 초과 → 200으로 클램프', async () => {
    mocks.mockFrom.mockImplementation(mockAppsQuery([], 0));
    const res = await GET(makeGetReq({ limit: '999' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.limit).toBe(200);
  });

  it('DB 오류 → 500', async () => {
    mocks.mockFrom.mockImplementation(mockAppsQuery([], 0, { message: 'DB error' }));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('검색 파라미터가 있으면 or 필터 적용', async () => {
    mocks.mockFrom.mockImplementation(mockAppsQuery([], 0));
    const res = await GET(makeGetReq({ search: '쿨한' }));
    expect(res.status).toBe(200);
  });

  it('정렬 파라미터 views → 정상 처리', async () => {
    mocks.mockFrom.mockImplementation(mockAppsQuery(SAMPLE_APPS, 2));
    const res = await GET(makeGetReq({ sort: 'views' }));
    expect(res.status).toBe(200);
  });

  it('페이지네이션 offset 반영', async () => {
    mocks.mockFrom.mockImplementation(mockAppsQuery([], 100));
    const res = await GET(makeGetReq({ limit: '10', offset: '30' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.offset).toBe(30);
    expect(body.limit).toBe(10);
  });
});

// ── DELETE 테스트 ──────────────────────────────────────────────────────────
describe('DELETE /api/admin/apps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await DELETE(makeDeleteReq('my-cool-app'));
    expect(res.status).toBe(401);
  });

  it('slug 없음 → 400', async () => {
    const res = await DELETE(makeDeleteReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/slug/i);
  });

  it('정상 삭제 → 200 + { ok: true, slug }', async () => {
    mocks.mockFrom.mockImplementation(mockDeleteChain(null));
    const res = await DELETE(makeDeleteReq('my-cool-app'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.slug).toBe('my-cool-app');
  });

  it('DB 삭제 오류 → 500', async () => {
    mocks.mockFrom.mockImplementation(mockDeleteChain({ message: 'delete failed' }));
    const res = await DELETE(makeDeleteReq('bad-slug'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
