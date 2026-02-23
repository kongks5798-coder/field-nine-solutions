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

import { GET } from '@/app/api/admin/users/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin/users');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

// ── 샘플 데이터 ─────────────────────────────────────────────────────────────
const SAMPLE_USERS = [
  {
    id: 'u1',
    email: 'admin@test.com',
    name: '관리자',
    plan: 'pro',
    plan_expires_at: '2025-12-31',
    plan_updated_at: '2025-01-01',
    created_at: '2024-06-01',
    stripe_customer_id: 'cus_abc',
  },
  {
    id: 'u2',
    email: 'user@test.com',
    name: '일반유저',
    plan: null,
    plan_expires_at: null,
    plan_updated_at: null,
    created_at: '2024-07-15',
    stripe_customer_id: null,
  },
];

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────
/**
 * profiles.select(...).order(...).range(...)
 * 선택적: .eq() / .is() / .ilike() 필터 체인
 *
 * 1차 호출: 유저 목록 쿼리
 * 2차 호출: 전체 유저수 count 쿼리
 */
function mockUsersQuery(
  data: unknown[] | null,
  total: number | null = null,
  error: { message: string } | null = null,
) {
  const result = { data, error, count: null as number | null };

  // thenable 객체 + 필터 메서드 체인
  function makeThenable() {
    const t = {
      then: (resolve: (v: typeof result) => void) => resolve(result),
      eq: vi.fn().mockReturnValue({
        then: (resolve: (v: typeof result) => void) => resolve(result),
        ilike: vi.fn().mockReturnValue({
          then: (resolve: (v: typeof result) => void) => resolve(result),
        }),
      }),
      is: vi.fn().mockReturnValue({
        then: (resolve: (v: typeof result) => void) => resolve(result),
        ilike: vi.fn().mockReturnValue({
          then: (resolve: (v: typeof result) => void) => resolve(result),
        }),
      }),
      ilike: vi.fn().mockReturnValue({
        then: (resolve: (v: typeof result) => void) => resolve(result),
        eq: vi.fn().mockReturnValue({
          then: (resolve: (v: typeof result) => void) => resolve(result),
        }),
      }),
    };
    return t;
  }

  // count 쿼리용 결과
  const countResult = { count: total ?? (data?.length ?? 0) };

  let callCount = 0;
  return () => {
    callCount++;
    if (callCount === 1) {
      // 유저 목록 쿼리: select → order → range → (필터)
      const rangeFn = vi.fn().mockReturnValue(makeThenable());
      const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
      return {
        select: vi.fn().mockReturnValue({
          order: orderFn,
        }),
      };
    }
    // 전체 유저수 count 쿼리: select("id", { count, head }) → thenable
    return {
      select: vi.fn().mockReturnValue({
        then: (resolve: (v: typeof countResult) => void) => resolve(countResult),
      }),
    };
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  // ── 1. 인증 실패 → 401 ──────────────────────────────────────────────────
  it('인증 실패 → 401 반환', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 2. 정상 유저 목록 반환 ────────────────────────────────────────────────
  it('인증 성공 → 200 + 유저 목록 반환', async () => {
    mocks.mockFrom.mockImplementation(mockUsersQuery(SAMPLE_USERS, 2));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(50);
  });

  // ── 3. DB 오류 → 500 반환 ────────────────────────────────────────────────
  it('DB 오류 → 500 반환', async () => {
    mocks.mockFrom.mockImplementation(
      mockUsersQuery(null, null, { message: 'relation "profiles" does not exist' }),
    );

    const res = await GET(makeReq());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to fetch users');
  });

  // ── 4. limit/offset 파라미터 반영 ─────────────────────────────────────────
  it('limit/offset 쿼리 파라미터 반영', async () => {
    mocks.mockFrom.mockImplementation(mockUsersQuery([], 0));

    const res = await GET(makeReq({ limit: '10', offset: '20' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.limit).toBe(10);
    expect(body.offset).toBe(20);
  });

  // ── 5. limit 최대값 200 초과 시 200으로 제한 ──────────────────────────────
  it('limit 최대값 200 초과 시 200으로 제한', async () => {
    mocks.mockFrom.mockImplementation(mockUsersQuery([], 0));

    const res = await GET(makeReq({ limit: '999' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.limit).toBe(200);
  });
});
