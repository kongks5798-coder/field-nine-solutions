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

import { GET } from '@/app/api/admin/billing-events/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/billing-events');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────

/**
 * billing_events 메인 쿼리 체인:
 * select → order → range → (eq/gte/lte 필터 옵션)
 * 필터 적용 여부에 관계없이 최종 결과를 반환하도록 Proxy 활용
 */
function createChainProxy(resolvedValue: { data: unknown[] | null; error: { message: string } | null }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') {
        // Promise-like: await 시 resolve
        return (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      if (prop === 'data') return resolvedValue.data;
      if (prop === 'error') return resolvedValue.error;
      // eq, gte, lte, ilike 등 모든 필터 메서드 → 자기 자신 반환
      return vi.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

function mockBillingEventsQuery(
  data: unknown[] | null,
  error: { message: string } | null = null,
) {
  const resolvedValue = { data, error };
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockReturnValue(createChainProxy(resolvedValue)),
      }),
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: data, error: null }),
      }),
    }),
  };
}

/** 월간 합산 쿼리: billing_events.select("amount").eq("type",...).gte("created_at",...) */
function mockMonthlyRevenueQuery(data: { amount: number }[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/billing-events', () => {
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

  it('결제 이벤트 목록 반환 → 200', async () => {
    const sampleEvents = [
      { id: 'e1', user_id: 'u1', type: 'payment_succeeded', amount: 29000, description: '구독 결제', metadata: null, created_at: '2024-01-15', profiles: { email: 'test@test.com', name: '홍길동' } },
      { id: 'e2', user_id: 'u2', type: 'subscription_canceled', amount: 0, description: '구독 취소', metadata: null, created_at: '2024-01-14', profiles: { email: 'user2@test.com', name: '김철수' } },
    ];
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockBillingEventsQuery(sampleEvents);
      return mockMonthlyRevenueQuery([{ amount: 29000 }]);
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toHaveLength(2);
    expect(body.events[0].type).toBe('payment_succeeded');
    expect(body.monthlyRevenue).toBe(29000);
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(100);
  });

  it('빈 결과 → 200 + 빈 배열 + monthlyRevenue 0', async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockBillingEventsQuery([]);
      return mockMonthlyRevenueQuery([]);
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toEqual([]);
    expect(body.monthlyRevenue).toBe(0);
  });

  it('type 필터 파라미터 적용', async () => {
    const filtered = [
      { id: 'e1', user_id: 'u1', type: 'payment_succeeded', amount: 29000, description: '결제', metadata: null, created_at: '2024-01-15', profiles: { email: 'test@test.com', name: '홍길동' } },
    ];
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockBillingEventsQuery(filtered);
      return mockMonthlyRevenueQuery([{ amount: 29000 }]);
    });

    const res = await GET(makeReq({ type: 'payment_succeeded' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].type).toBe('payment_succeeded');
  });

  it('날짜 범위 필터(from, to) 적용', async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockBillingEventsQuery([]);
      return mockMonthlyRevenueQuery([]);
    });

    const res = await GET(makeReq({ from: '2024-01-01', to: '2024-01-31' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toEqual([]);
  });

  it('DB 에러 → 500 반환', async () => {
    mocks.mockFrom.mockReturnValue(
      mockBillingEventsQuery(null, { message: 'relation "billing_events" does not exist' }),
    );

    const res = await GET(makeReq());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to fetch billing events');
  });

  it('limit 500 초과 시 500으로 제한', async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return mockBillingEventsQuery([]);
      return mockMonthlyRevenueQuery([]);
    });

    const res = await GET(makeReq({ limit: '999' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.limit).toBe(500);
  });
});
