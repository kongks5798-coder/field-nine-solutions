// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFetch: vi.fn(),
  mockStripeRetrieve: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: mocks.mockFrom,
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = {
      sessions: {
        retrieve: mocks.mockStripeRetrieve,
      },
    };
  },
}));

import { GET } from '@/app/api/billing/top-up/confirm/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/billing/top-up/confirm');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

/** spending_caps select → single, upsert, billing_events insert 체인 모킹 */
function setupSupabaseMocks() {
  mocks.mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          like: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'uid-abcd1234' } }),
          }),
        }),
      };
    }
    if (table === 'spending_caps') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { hard_limit: 50000, warn_threshold: 42500 } }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    if (table === 'billing_events') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return { select: vi.fn().mockResolvedValue({ data: null }) };
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/billing/top-up/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mocks.mockFetch as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.TOSSPAYMENTS_SECRET_KEY = 'test-toss-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_stripe';
  });

  it('유효하지 않은 amount → /billing?topup=fail 리다이렉트', async () => {
    const res = await GET(makeReq({ amount: '9999', paymentKey: 'pk_1', orderId: 'topup-abcd-123' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=fail');
  });

  it('paymentKey 또는 orderId 누락 → /billing?topup=fail 리다이렉트', async () => {
    const res = await GET(makeReq({ amount: '10000' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=fail');
  });

  it('Toss 결제 확인 성공 → /billing?topup=success 리다이렉트 + spending_cap 증액', async () => {
    setupSupabaseMocks();
    mocks.mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ paymentKey: 'pk_1', status: 'DONE' }),
    });

    const res = await GET(makeReq({
      amount: '10000',
      paymentKey: 'pk_1',
      orderId: 'topup-abcd-1234567890',
    }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=success');
    expect(res.headers.get('location')).toContain('amount=10000');
  });

  it('Toss API 실패 → /billing?topup=fail 리다이렉트', async () => {
    mocks.mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad Request' }),
    });

    const res = await GET(makeReq({
      amount: '10000',
      paymentKey: 'pk_1',
      orderId: 'topup-abcd-1234567890',
    }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=fail');
  });

  it('Stripe 결제 성공 → /billing?topup=success 리다이렉트', async () => {
    setupSupabaseMocks();
    mocks.mockStripeRetrieve.mockResolvedValueOnce({
      payment_status: 'paid',
      metadata: { user_id: 'uid-abcd1234' },
    });

    const res = await GET(makeReq({
      amount: '20000',
      provider: 'stripe',
      session_id: 'cs_test_123',
    }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=success');
    expect(res.headers.get('location')).toContain('amount=20000');
  });

  it('Stripe 결제 미완료(unpaid) → /billing?topup=fail 리다이렉트', async () => {
    mocks.mockStripeRetrieve.mockResolvedValueOnce({
      payment_status: 'unpaid',
      metadata: { user_id: 'uid-abcd1234' },
    });

    const res = await GET(makeReq({
      amount: '20000',
      provider: 'stripe',
      session_id: 'cs_test_123',
    }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=fail');
  });

  it('예외 발생 시 → /billing?topup=fail 리다이렉트', async () => {
    mocks.mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await GET(makeReq({
      amount: '50000',
      paymentKey: 'pk_1',
      orderId: 'topup-abcd-1234567890',
    }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('topup=fail');
  });
});
