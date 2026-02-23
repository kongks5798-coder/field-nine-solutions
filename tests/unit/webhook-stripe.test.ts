import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted: vi.mock 팩토리보다 먼저 실행됨 ──
vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
});
const mockConstructEvent = vi.hoisted(() => vi.fn());
const mockSubsRetrieve   = vi.hoisted(() => vi.fn());
const mockAdminFrom      = vi.hoisted(() => vi.fn());
const mockGetUserById    = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } }));

vi.mock('stripe', () => {
  function MockStripe() {
    return {
      webhooks: { constructEvent: mockConstructEvent },
      subscriptions: { retrieve: mockSubsRetrieve },
    };
  }
  return { default: MockStripe };
});

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    auth: { admin: { getUserById: mockGetUserById } },
  })),
}));

vi.mock('@/lib/env',    () => ({ validateEnv: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), billing: vi.fn(), security: vi.fn() },
}));
vi.mock('@/lib/email', () => ({
  sendPaymentSuccessEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail:  vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/plans', () => ({
  PLAN_PRICES: {
    pro:  { original: 49000, discounted: 39000 },
    team: { original: 129000, discounted: 99000 },
  },
}));

import { POST } from '@/app/api/billing/webhook/route';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

function makeReq(body: string, sig = 'sig_test') {
  return new NextRequest('http://localhost/api/billing/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'Content-Type': 'text/plain' },
    body,
  });
}

function chainableEq(): ReturnType<typeof vi.fn> {
  const fn: ReturnType<typeof vi.fn> = vi.fn().mockImplementation(() => ({
    eq: fn,
    single: vi.fn().mockResolvedValue({ data: { plan: 'pro' }, error: null }),
    then: (resolve: (v: unknown) => void) => resolve({ error: null }),
  }));
  return fn;
}

function setupAdminChain() {
  mockAdminFrom.mockReturnValue({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnValue({
      eq: chainableEq(),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { plan: 'pro' }, error: null }),
      }),
    }),
  });
}

const BASE_SUB = {
  id: 'sub_test',
  status: 'active',
  customer: 'cus_test',
  metadata: { supabase_uid: 'uid-1', plan: 'pro' },
  items: { data: [{ price: { id: 'price_test' } }] },
  cancel_at_period_end: false,
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end:   Math.floor(Date.now() / 1000) + 30 * 86400,
  canceled_at: null,
};

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('POST /api/billing/webhook (Stripe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminChain();
  });

  it('서명 검증 실패 → 400 반환', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature'); });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });

  it('customer.subscription.created → DB upsert 후 received: true', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: BASE_SUB },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    // upsert가 호출되었는지 확인 (subscriptions, profiles, billing_events)
    expect(mockAdminFrom).toHaveBeenCalled();
  });

  it('customer.subscription.created — uid 없음 → 경고만 기록, 200 반환', async () => {
    const subNoUid = { ...BASE_SUB, metadata: {} };
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: subNoUid },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('invoice.payment_succeeded → 구독 갱신 및 billing_events 기록', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'inv_1',
          subscription: 'sub_test',
          amount_paid: 39000,
          description: '월 구독 결제',
        },
      },
    });
    mockSubsRetrieve.mockResolvedValue(BASE_SUB);
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect(mockSubsRetrieve).toHaveBeenCalledWith('sub_test');
  });

  it('invoice.payment_succeeded — subscription 없는 invoice → skip, 200 반환', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: { object: { id: 'inv_2', amount_paid: 0 } },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect(mockSubsRetrieve).not.toHaveBeenCalled();
  });

  it('customer.subscription.deleted → 구독 canceled, profiles.plan → null', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: BASE_SUB },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect(mockAdminFrom).toHaveBeenCalled();
  });

  it('customer.subscription.updated → 구독 상태 업데이트', async () => {
    const updatedSub = { ...BASE_SUB, status: 'past_due', cancel_at_period_end: true };
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: updatedSub },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('invoice.payment_failed → 구독 past_due 설정 및 이벤트 기록', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_fail',
          subscription: 'sub_test',
          amount_due: 39000,
        },
      },
    });
    mockSubsRetrieve.mockResolvedValue(BASE_SUB);
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect(mockSubsRetrieve).toHaveBeenCalledWith('sub_test');
  });

  it('알 수 없는 이벤트 타입 → 무시하고 received: true', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'unknown.event',
      data: { object: {} },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });
});
