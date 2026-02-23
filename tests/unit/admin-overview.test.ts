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

import { GET } from '@/app/api/admin/overview/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(path = '/api/admin/overview') {
  return new NextRequest(`http://localhost${path}`);
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────

/** profiles.select("id", { count: "exact", head: true }) → { count } */
function mockCountQuery(count: number | null) {
  return { select: vi.fn().mockResolvedValue({ count }) };
}

/** profiles.select("plan").not(...) → { data } */
function mockPlanDistQuery(data: { plan: string }[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      not: vi.fn().mockResolvedValue({ data }),
    }),
  };
}

/** billing_events.select(...).eq(...).gte(...) → { data } */
function mockBillingEventsRangeQuery(data: { amount: number; type: string }[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

/** billing_events.select(...).eq(...).gte(...).lte(...) → { data } */
function mockBillingEventsRangeQueryWithLte(data: { amount: number; type: string }[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ data }),
        }),
      }),
    }),
  };
}

/** billing_events.select(...).order(...).limit(...) → { data } */
function mockRecentEventsQuery(data: unknown[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

/** subscriptions.select("id", { count: "exact", head: true }).eq("status", "active") → { count } */
function mockActiveSubsQuery(count: number | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ count }),
    }),
  };
}

// ── 기본 mock 데이터 설정 ───────────────────────────────────────────────────
function setupDefaultMocks() {
  let callIndex = 0;
  mocks.mockFrom.mockImplementation(() => {
    callIndex++;
    switch (callIndex) {
      case 1: return mockCountQuery(100);                          // totalUsers
      case 2: return mockPlanDistQuery([                           // planDist
        { plan: 'pro' }, { plan: 'pro' }, { plan: 'team' },
      ]);
      case 3: return mockBillingEventsRangeQuery([                 // thisMonthEvents
        { amount: 29000, type: 'payment_succeeded' },
        { amount: 59000, type: 'payment_succeeded' },
      ]);
      case 4: return mockBillingEventsRangeQueryWithLte([          // lastMonthEvents
        { amount: 29000, type: 'payment_succeeded' },
      ]);
      case 5: return mockRecentEventsQuery([                       // recentEvents
        { id: 'e1', user_id: 'u1', type: 'payment_succeeded', amount: 29000, description: '결제', created_at: '2024-01-15', profiles: { email: 'test@test.com' } },
      ]);
      case 6: return mockActiveSubsQuery(3);                       // activeSubs
      default: return mockCountQuery(0);
    }
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.TOSSPAYMENTS_SECRET_KEY = 'sk_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_stripe';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test';
    process.env.RESEND_API_KEY = 're_test';
    process.env.SENTRY_DSN = 'https://sentry.io';
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.io';
  });

  it('인증 실패 → 401 반환', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → 200 + overview 데이터 반환', async () => {
    setupDefaultMocks();
    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    // users 구조 검증
    expect(body.users).toBeDefined();
    expect(body.users.total).toBe(100);
    expect(body.users.pro).toBe(2);
    expect(body.users.team).toBe(1);
    expect(body.users.paid).toBe(3);
    expect(body.users.free).toBe(97);
  });

  it('수익 데이터(MRR) 계산 정확성 확인', async () => {
    setupDefaultMocks();
    const res = await GET(makeReq());
    const body = await res.json();

    // thisMonth: 29000 + 59000 = 88000
    expect(body.revenue.mrr).toBe(88000);
    // lastMonth: 29000
    expect(body.revenue.lastMrr).toBe(29000);
    // growth: ((88000 - 29000) / 29000) * 100 ≈ 203
    expect(body.revenue.mrrGrowth).toBe(203);
  });

  it('활성 구독 수 및 최근 이벤트 반환', async () => {
    setupDefaultMocks();
    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.activeSubs).toBe(3);
    expect(Array.isArray(body.recentEvents)).toBe(true);
    expect(body.recentEvents.length).toBe(1);
  });

  it('systemStatus 객체에 서비스 상태 포함', async () => {
    setupDefaultMocks();
    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.systemStatus).toBeDefined();
    expect(body.systemStatus.supabase).toBe(true);
    expect(body.systemStatus.toss).toBe(true);
    expect(body.systemStatus.stripe).toBe(true);
    expect(body.systemStatus.openai).toBe(true);
  });

  it('DB 데이터가 null 일 때 안전하게 기본값 반환', async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      switch (callIndex) {
        case 1: return mockCountQuery(null);                       // totalUsers = null
        case 2: return mockPlanDistQuery(null);                    // planDist = null
        case 3: return mockBillingEventsRangeQuery(null);          // thisMonthEvents = null
        case 4: return mockBillingEventsRangeQueryWithLte(null);   // lastMonthEvents = null
        case 5: return mockRecentEventsQuery(null);                // recentEvents = null
        case 6: return mockActiveSubsQuery(null);                  // activeSubs = null
        default: return mockCountQuery(0);
      }
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.users.total).toBe(0);
    expect(body.users.paid).toBe(0);
    expect(body.users.free).toBe(0);
    expect(body.revenue.mrr).toBe(0);
    expect(body.revenue.mrrGrowth).toBe(0);
    expect(body.activeSubs).toBe(0);
    expect(body.recentEvents).toEqual([]);
  });
});
