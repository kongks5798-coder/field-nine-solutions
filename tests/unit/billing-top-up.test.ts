// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── 환경변수 (vi.mock 팩토리보다 먼저 실행) ──
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY = 'test-toss-client-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_stripe';
});

// ── Supabase mock ──
const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ── Stripe mock ──
const mockCheckoutCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' }),
);

vi.mock('stripe', () => {
  function MockStripe() {
    return {
      checkout: { sessions: { create: mockCheckoutCreate } },
    };
  }
  return { default: MockStripe };
});

import { POST } from '@/app/api/billing/top-up/route';

// ── 헬퍼 ──
const SESSION = {
  data: { session: { user: { id: 'uid-1', email: 'test@example.com' } } },
  error: null,
};
const NO_SESSION = { data: { session: null }, error: null };

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/billing/top-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://fieldnine.io',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/billing/top-up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY = 'test-toss-client-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_stripe';
  });

  // ── 비인증 → 401 ──
  it('비인증 사용자 → 401 반환', async () => {
    const res = await POST(makeReq({ amount: 10000 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 잘못된 금액 → 400 ──
  it('유효하지 않은 충전 금액 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ amount: 99999 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('유효하지 않은');
  });

  it('금액 누락 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  // ── Toss 결제 성공 ──
  it('Toss 결제 → clientKey, orderId, successUrl 포함 200 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ amount: 10000, provider: 'toss' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toBe('toss');
    expect(body.clientKey).toBe('test-toss-client-key');
    expect(body.amount).toBe(10000);
    expect(body.orderId).toBeTruthy();
    expect(body.orderId).toContain('topup-');
    expect(body.successUrl).toContain('/api/billing/top-up/confirm');
    expect(body.orderName).toContain('크레딧 충전');
  });

  // ── Toss 미설정 → 503 ──
  it('TossPayments 미설정 → 503 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    delete process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;
    const res = await POST(makeReq({ amount: 20000, provider: 'toss' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('TossPayments');
  });

  // ── Stripe 결제 성공 ──
  it('Stripe 결제 → checkout URL 포함 200 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ amount: 50000, provider: 'stripe' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toBe('stripe');
    expect(body.url).toBe('https://checkout.stripe.com/test-session');

    // Stripe checkout.sessions.create 호출 파라미터 검증
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        currency: 'krw',
        metadata: expect.objectContaining({
          user_id: 'uid-1',
          top_up_amount: '50000',
        }),
      }),
    );
  });

  // ── Stripe 미설정 → 503 ──
  it('Stripe 미설정 → 503 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(makeReq({ amount: 10000, provider: 'stripe' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('Stripe');
  });

  // ── Stripe 세션 생성 실패 → 500 ──
  it('Stripe 세션 생성 예외 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockCheckoutCreate.mockRejectedValueOnce(new Error('Stripe API error'));
    const res = await POST(makeReq({ amount: 10000, provider: 'stripe' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('결제 세션 생성 실패');
  });

  // ── 기본 provider는 toss ──
  it('provider 미지정 시 기본값 toss로 처리', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ amount: 10000 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toBe('toss');
  });
});
