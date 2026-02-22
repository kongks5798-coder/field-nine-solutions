import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted ──
const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

vi.mock('stripe', () => {
  const mocks = {
    listInvoices: vi.fn().mockResolvedValue({ data: [{ payment_intent: 'pi_test' }] }),
    createRefund: vi.fn().mockResolvedValue({ id: 'refund_1' }),
  };
  function MockStripe() {
    return {
      invoices: { list: mocks.listInvoices },
      refunds:  { create: mocks.createRefund },
    };
  }
  (MockStripe as unknown as Record<string, unknown>).__mocks__ = mocks;
  return { default: MockStripe };
});

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), billing: vi.fn() },
}));

import { POST } from '@/app/api/billing/refund/route';

// ── 헬퍼 ──
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(body: unknown = {}) {
  return new NextRequest('http://localhost/api/billing/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// 7일 이내 결제 이벤트
const RECENT_EVENT = {
  id: 'evt-1',
  amount: 39000,
  created_at: new Date().toISOString(),
};

// 7일 초과 (null 반환으로 시뮬레이션)

function setupMockChain(
  paymentEvent: unknown,
  sub: unknown = { stripe_subscription_id: 'stripe_sub_1', toss_payment_key: null }
) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // billing_events query (recent payment)
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: paymentEvent }),
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    }
    if (callCount === 2) {
      // subscriptions query
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: sub }),
          }),
        }),
      };
    }
    // profiles update, subscriptions update, billing_events insert
    return {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
  });
}

// ── 테스트 ──
describe('POST /api/billing/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('7일 이내 결제 있음 + Stripe → 환불 성공', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(RECENT_EVENT);
    const res = await POST(makeReq({ reason: '사용하지 않음' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('39,000');
    expect(body.message).toContain('환불');
  });

  it('7일 초과 — 환불 가능 결제 없음 → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(null); // no recent payment
    const res = await POST(makeReq());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('7일');
  });

  it('Toss 결제 환불 성공', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const tossSub = { stripe_subscription_id: null, toss_payment_key: 'toss_pk_1' };
    setupMockChain(RECENT_EVENT, tossSub);
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('tosspayments.com'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('reason 필드 없어도 기본값으로 처리', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(RECENT_EVENT);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
  });

  it('Stripe·Toss 모두 실패 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const noPaymentSub = { stripe_subscription_id: null, toss_payment_key: null };
    setupMockChain(RECENT_EVENT, noPaymentSub);
    const res = await POST(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('실패');
  });

  it('예외 발생 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockImplementation(() => {
      throw new Error('DB connection error');
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('오류');
  });
});
