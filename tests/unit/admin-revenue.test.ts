// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import { GET } from '@/app/api/admin/revenue/route';

const ADMIN_SECRET = 'test-admin-secret-1234';

function makeReq(secret?: string) {
  const headers: Record<string, string> = {};
  if (secret) headers['x-admin-secret'] = secret;
  return new NextRequest('http://localhost/api/admin/revenue', { method: 'GET', headers });
}

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────

/** profiles.select('*', { count: 'exact', head: true }) → { count } */
function mockCountQuery(count: number | null) {
  return { select: vi.fn().mockResolvedValue({ count }) };
}

/** profiles.select(...).eq('plan', ...) → { count } */
function mockPlanCountQuery(count: number | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ count }),
    }),
  };
}

/** monthly_usage.select('amount_krw').eq('billing_period', ...).eq('status', ...) → { data } */
function mockUsageQuery(data: { amount_krw: number | null }[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

/** monthly_usage.select('amount_krw, user_id').eq('status', 'failed') → { data } */
function mockFailedQuery(data: { amount_krw: number | null; user_id: string }[] | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data }),
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

// ── 기본 mock 데이터 설정 ───────────────────────────────────────────────────
function setupDefaultMocks() {
  let callIndex = 0;
  mocks.mockFrom.mockImplementation(() => {
    callIndex++;
    switch (callIndex) {
      case 1: return mockCountQuery(50);                           // totalUsers
      case 2: return mockPlanCountQuery(10);                       // proUsers
      case 3: return mockPlanCountQuery(5);                        // teamUsers
      case 4: return mockUsageQuery([                              // thisMonth
        { amount_krw: 29000 }, { amount_krw: 59000 },
      ]);
      case 5: return mockUsageQuery([                              // lastMonth
        { amount_krw: 29000 },
      ]);
      case 6: return mockFailedQuery([                             // outstanding
        { amount_krw: 15000, user_id: 'u1' },
      ]);
      case 7: return mockRecentEventsQuery([                       // recentEvents
        { type: 'payment_succeeded', amount: 29000, description: '결제 완료', created_at: '2024-01-15' },
      ]);
      default: return mockCountQuery(0);
    }
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/revenue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SECRET = ADMIN_SECRET;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('x-admin-secret 헤더 없음 → 401 반환', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('잘못된 x-admin-secret → 401 반환', async () => {
    const res = await GET(makeReq('wrong-secret'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('ADMIN_SECRET 미설정 → 401 반환', async () => {
    delete process.env.ADMIN_SECRET;
    const res = await GET(makeReq('some-secret'));
    expect(res.status).toBe(401);
  });

  it('인증 성공 → 200 + revenue 데이터 반환', async () => {
    setupDefaultMocks();
    const res = await GET(makeReq(ADMIN_SECRET));
    expect(res.status).toBe(200);

    const body = await res.json();
    // users 구조 검증
    expect(body.users).toBeDefined();
    expect(body.users.total).toBe(50);
    expect(body.users.pro).toBe(10);
    expect(body.users.team).toBe(5);
    expect(body.users.free).toBe(35); // 50 - 10 - 5
  });

  it('수익 계산 정확성 확인 (thisMonth, lastMonth, outstanding)', async () => {
    setupDefaultMocks();
    const res = await GET(makeReq(ADMIN_SECRET));
    const body = await res.json();

    // thisMonth: 29000 + 59000 = 88000
    expect(body.revenue.thisMonth).toBe(88000);
    // lastMonth: 29000
    expect(body.revenue.lastMonth).toBe(29000);
    // outstanding: 15000
    expect(body.revenue.outstanding).toBe(15000);
    expect(body.revenue.failedCount).toBe(1);
  });

  it('DB 조회 실패 → 500 반환', async () => {
    mocks.mockFrom.mockImplementation(() => {
      throw new Error('Connection refused');
    });

    const res = await GET(makeReq(ADMIN_SECRET));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('데이터 조회 실패');
  });

  it('데이터가 모두 null/빈 배열일 때 안전하게 기본값 반환', async () => {
    let callIndex = 0;
    mocks.mockFrom.mockImplementation(() => {
      callIndex++;
      switch (callIndex) {
        case 1: return mockCountQuery(null);
        case 2: return mockPlanCountQuery(null);
        case 3: return mockPlanCountQuery(null);
        case 4: return mockUsageQuery(null);
        case 5: return mockUsageQuery(null);
        case 6: return mockFailedQuery(null);
        case 7: return mockRecentEventsQuery(null);
        default: return mockCountQuery(0);
      }
    });

    const res = await GET(makeReq(ADMIN_SECRET));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.users.total).toBe(0);
    expect(body.users.pro).toBe(0);
    expect(body.users.team).toBe(0);
    expect(body.users.free).toBe(0);
    expect(body.revenue.thisMonth).toBe(0);
    expect(body.revenue.lastMonth).toBe(0);
    expect(body.revenue.outstanding).toBe(0);
    expect(body.revenue.failedCount).toBe(0);
    expect(body.recentEvents).toEqual([]);
  });
});
