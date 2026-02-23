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

import { GET } from '@/app/api/admin/subscriptions/route';

// ── 인증 결과 상수 ──────────────────────────────────────────────────────────
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin/subscriptions');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

// ── 샘플 데이터 ─────────────────────────────────────────────────────────────
const SAMPLE_SUBS = [
  {
    id: 'sub-1', user_id: 'u1', plan: 'pro', status: 'active',
    stripe_subscription_id: 'sub_stripe_1', stripe_customer_id: 'cus_1',
    toss_payment_key: null, toss_order_id: null,
    original_price: 29000, discounted_price: null,
    current_period_start: '2024-01-01', current_period_end: '2024-02-01',
    cancel_at_period_end: false, canceled_at: null,
    created_at: '2024-01-01', updated_at: '2024-01-01',
    profiles: { email: 'user1@test.com', name: '홍길동' },
  },
  {
    id: 'sub-2', user_id: 'u2', plan: 'team', status: 'active',
    stripe_subscription_id: null, stripe_customer_id: null,
    toss_payment_key: 'tpk_123', toss_order_id: 'order_123',
    original_price: 59000, discounted_price: 49000,
    current_period_start: '2024-01-15', current_period_end: '2024-02-15',
    cancel_at_period_end: false, canceled_at: null,
    created_at: '2024-01-15', updated_at: '2024-01-15',
    profiles: { email: 'user2@test.com', name: '김민준' },
  },
];

// ── 체인 모킹 헬퍼 ─────────────────────────────────────────────────────────

/**
 * subscriptions.select(...).order(...).range(...) → thenable { data, error }
 * .range() 결과에 .eq() 체인도 지원 (status 필터링)
 *
 * 체인 순서: select → order → range → (선택) eq → await
 */
function mockSubsQuery(data: unknown[] | null, error: { message: string } | null = null) {
  const result = { data, error };

  // thenable 객체: await 시 result 반환 + .eq() 메서드 포함
  function makeThenable() {
    return {
      then: (resolve: (v: typeof result) => void) => resolve(result),
      eq: vi.fn().mockReturnValue({
        then: (resolve: (v: typeof result) => void) => resolve(result),
      }),
    };
  }

  const rangeFn = vi.fn().mockReturnValue(makeThenable());
  const orderFn = vi.fn().mockReturnValue({ range: rangeFn });

  return {
    select: vi.fn().mockReturnValue({
      order: orderFn,
    }),
  };
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/admin/subscriptions', () => {
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

  it('인증 성공 → 200 + 구독 목록 반환 (provider 필드 포함)', async () => {
    mocks.mockFrom.mockReturnValue(mockSubsQuery(SAMPLE_SUBS));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.subscriptions)).toBe(true);
    expect(body.subscriptions.length).toBe(2);

    // Stripe 구독 → provider: "stripe"
    expect(body.subscriptions[0].provider).toBe('stripe');
    // Toss 구독 → provider: "toss"
    expect(body.subscriptions[1].provider).toBe('toss');

    // 기본 offset/limit 확인
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(50);
  });

  it('빈 구독 목록 → 200 + 빈 배열 반환', async () => {
    mocks.mockFrom.mockReturnValue(mockSubsQuery([]));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.subscriptions).toEqual([]);
  });

  it('data가 null → 200 + 빈 배열 반환', async () => {
    mocks.mockFrom.mockReturnValue(mockSubsQuery(null));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.subscriptions).toEqual([]);
  });

  it('status 쿼리 파라미터로 필터링 가능', async () => {
    const activeSub = [SAMPLE_SUBS[0]];
    mocks.mockFrom.mockReturnValue(mockSubsQuery(activeSub));

    const res = await GET(makeReq({ status: 'active' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.subscriptions.length).toBe(1);
    expect(body.subscriptions[0].status).toBe('active');
  });

  it('limit/offset 쿼리 파라미터 반영 확인', async () => {
    mocks.mockFrom.mockReturnValue(mockSubsQuery([]));

    const res = await GET(makeReq({ limit: '10', offset: '20' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.limit).toBe(10);
    expect(body.offset).toBe(20);
  });

  it('limit 최대값 200 초과 시 200으로 제한', async () => {
    mocks.mockFrom.mockReturnValue(mockSubsQuery([]));

    const res = await GET(makeReq({ limit: '999' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.limit).toBe(200);
  });

  it('DB 오류 → 500 반환', async () => {
    mocks.mockFrom.mockReturnValue(
      mockSubsQuery(null, { message: 'relation "subscriptions" does not exist' })
    );

    const res = await GET(makeReq());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to fetch subscriptions');
  });
});
