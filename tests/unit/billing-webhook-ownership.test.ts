// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

describe('POST /api/billing/webhook ownership and edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('customer ownership mismatch skips subscription creation', async () => {
    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ user_id: 'other-uid' }], error: null }),
          }),
          single: vi.fn().mockResolvedValue({ data: { plan: 'pro' }, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: chainableEq() }),
    }));

    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: BASE_SUB },
    });

    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('subscription.updated with cancel_at_period_end true', async () => {
    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          single: vi.fn().mockResolvedValue({ data: { plan: 'pro' }, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: chainableEq() }),
    }));

    const cancelingSub = {
      ...BASE_SUB,
      cancel_at_period_end: true,
      canceled_at: Math.floor(Date.now() / 1000),
    };
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: cancelingSub },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('subscription.deleted with missing uid is ignored', async () => {
    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: chainableEq() }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }));

    const subNoUid = { ...BASE_SUB, metadata: {} };
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: subNoUid },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it('invoice.payment_failed with missing uid skips processing', async () => {
    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({ eq: chainableEq() }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }));

    const subNoUid = { ...BASE_SUB, metadata: {} };
    mockSubsRetrieve.mockResolvedValue(subNoUid);

    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: { object: { id: 'inv_fail', subscription: 'sub_test', amount_due: 39000 } },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
  });

  it('processing exception returns 500', async () => {
    mockAdminFrom.mockImplementation(() => {
      throw new Error('Unexpected DB crash');
    });
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: BASE_SUB },
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Webhook processing error');
  });
});
