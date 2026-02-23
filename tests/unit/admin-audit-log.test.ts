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

import { GET } from '@/app/api/admin/audit-log/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/audit-log');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/** select → order → range → (ilike/eq 필터) 체인 */
function mockAuditQuery(data: unknown[] | null, error: { message: string } | null = null) {
  const resolvedValue = { data, error };
  const rangeResult = {
    ilike: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolvedValue),
    }),
    eq: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve: (v: unknown) => void) => resolve(resolvedValue),
  };
  // Promise-like: 필터 없으면 range 결과가 직접 resolve
  Object.assign(rangeResult, resolvedValue);

  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockReturnValue(rangeResult),
      }),
    }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/audit-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('인증 실패 → 401 반환', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('감사 로그 목록 반환 → 200', async () => {
    const sampleLogs = [
      { id: '1', user_id: 'u1', action: 'auth.login', resource: '/login', ip: '1.2.3.4', user_agent: 'Chrome', status_code: 200, metadata: null, created_at: '2024-01-15T00:00:00Z' },
      { id: '2', user_id: 'u2', action: 'rate_limited', resource: '/api/ai', ip: '5.6.7.8', user_agent: 'Firefox', status_code: 429, metadata: null, created_at: '2024-01-14T00:00:00Z' },
    ];
    mocks.mockFrom.mockReturnValue(mockAuditQuery(sampleLogs));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.logs).toHaveLength(2);
    expect(body.logs[0].action).toBe('auth.login');
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(100);
  });

  it('빈 결과 → 200 + 빈 배열', async () => {
    mocks.mockFrom.mockReturnValue(mockAuditQuery([]));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.logs).toEqual([]);
  });

  it('null 데이터 → 200 + 빈 배열 (안전한 기본값)', async () => {
    mocks.mockFrom.mockReturnValue(mockAuditQuery(null));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.logs).toEqual([]);
  });

  it('페이지네이션 파라미터(offset, limit) 적용', async () => {
    mocks.mockFrom.mockReturnValue(mockAuditQuery([]));

    const res = await GET(makeReq({ offset: '50', limit: '25' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.offset).toBe(50);
    expect(body.limit).toBe(25);
  });

  it('limit 500 초과 시 500으로 제한', async () => {
    mocks.mockFrom.mockReturnValue(mockAuditQuery([]));

    const res = await GET(makeReq({ limit: '999' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.limit).toBe(500);
  });

  it('DB 에러 → 500 반환', async () => {
    mocks.mockFrom.mockReturnValue(mockAuditQuery(null, { message: 'DB connection failed' }));

    const res = await GET(makeReq());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('DB connection failed');
  });
});
