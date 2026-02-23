// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted: vi.mock 팩토리보다 먼저 실행됨 ──
const mockGetSession    = vi.hoisted(() => vi.fn());
const mockAdminFrom     = vi.hoisted(() => vi.fn());
const mockRefundsCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 're_test' }));
const mockInvoicesList  = vi.hoisted(() => vi.fn());

/**
 * createServerClient는 두 번 호출됩니다:
 *  1) anon key -> auth 클라이언트 (getSession용)
 *  2) service_role key -> admin 클라이언트 (DB 조회/수정용)
 */
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, key: string) => {
    if (key === 'test-service-role-key') {
      return { from: mockAdminFrom };
    }
    return { auth: { getSession: mockGetSession } };
  }),
}));

vi.mock('stripe', () => {
  function MockStripe() {
    return {
      invoices: { list: mockInvoicesList },
      refunds:  { create: mockRefundsCreate },
    };
  }
  return { default: MockStripe };
});

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));

import { POST } from '@/app/api/billing/refund/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}
const NO_SESSION = { data: { session: null } };

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/billing/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const PAYMENT_EVENT = {
  id: 'evt-1',
  amount: 49000,
  created_at: new Date().toISOString(),
};

const STRIPE_SUB = {
  stripe_subscription_id: 'sub_stripe_123',
  toss_payment_key: null,
  status: 'active',
};

const TOSS_SUB = {
  stripe_subscription_id: null,
  toss_payment_key: 'pk_toss_123',
  status: 'active',
};

/**
 * mockAdminFrom 설정 헬퍼
 *
 * 라우트 내 admin.from() 호출 순서:
 *  1. billing_events — 멱등성 검사 (select -> eq -> eq -> limit -> maybeSingle)
 *  2. billing_events — 최근 결제 이벤트 조회 (select -> eq -> eq -> gte -> order -> limit -> single)
 *  3. subscriptions  — 구독 정보 조회 (select -> eq -> single)
 *  4~: refund 성공 후
 *     profiles       — 플랜 초기화 (update -> eq -> not -> select)
 *     subscriptions  — 상태 refunded (update -> eq -> eq)
 *     billing_events — 환불 이벤트 기록 (insert)
 */
function setupAdminMock(opts: {
  existingRefund?: { id: string } | null;
  paymentEvent?: typeof PAYMENT_EVENT | null;
  subscription?: typeof STRIPE_SUB | typeof TOSS_SUB | { stripe_subscription_id: null; toss_payment_key: null; status: string } | null;
}) {
  const {
    existingRefund = null,
    paymentEvent = PAYMENT_EVENT,
    subscription = STRIPE_SUB,
  } = opts;

  let billingEventsCallCount = 0;
  let subscriptionsCallCount = 0;

  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'billing_events') {
      billingEventsCallCount++;
      if (billingEventsCallCount === 1) {
        // 멱등성 검사: select -> eq -> eq -> limit -> maybeSingle
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: existingRefund }),
                }),
              }),
            }),
          }),
        };
      }
      if (billingEventsCallCount === 2) {
        // 최근 결제 이벤트 조회: select -> eq -> eq -> gte -> order -> limit -> single
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
      // 세 번째 호출: 환불 이벤트 insert
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }

    if (table === 'subscriptions') {
      subscriptionsCallCount++;
      if (subscriptionsCallCount === 1) {
        // 구독 정보 조회: select -> eq -> single
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: subscription }),
            }),
          }),
        };
      }
      // 구독 상태 update: update -> eq -> eq
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }

    if (table === 'profiles') {
      // 플랜 초기화: update -> eq -> not -> select
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [{ id: 'uid-1' }] }),
            }),
          }),
        }),
      };
    }

    return {};
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('POST /api/billing/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
    process.env.TOSSPAYMENTS_SECRET_KEY = 'test-toss-key';
  });

  it('비인증 요청 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({ reason: '테스트' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('중복 환불 시도 → 409 반환 (멱등성)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ existingRefund: { id: 'refund-existing' } });

    const res = await POST(makeReq({ reason: '재환불 시도' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('이미 처리된 환불');
  });

  it('환불 가능한 결제 없음 (7일 초과) → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({ existingRefund: null, paymentEvent: null });

    const res = await POST(makeReq({ reason: '테스트' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('7일');
  });

  it('Stripe 환불 성공 → 200 + 환불 금액 표시', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({
      existingRefund: null,
      paymentEvent: PAYMENT_EVENT,
      subscription: STRIPE_SUB,
    });

    mockInvoicesList.mockResolvedValue({
      data: [{ payment_intent: 'pi_test_123' }],
    });

    const res = await POST(makeReq({ reason: '서비스 불만족' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('49,000');
    expect(body.message).toContain('환불');

    // Stripe refunds.create가 올바른 인자로 호출됐는지 확인
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_test_123',
      reason: 'requested_by_customer',
    });
  });

  it('Toss 환불 성공 (Stripe 구독 없을 때) → 200', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({
      existingRefund: null,
      paymentEvent: PAYMENT_EVENT,
      subscription: TOSS_SUB,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'CANCELED' }),
    } as unknown as Response);

    const res = await POST(makeReq({ reason: '변심' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('환불');

    // TossPayments API 호출 확인
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.tosspayments.com/v1/payments/${TOSS_SUB.toss_payment_key}/cancel`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('Stripe + Toss 모두 환불 불가능 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({
      existingRefund: null,
      paymentEvent: PAYMENT_EVENT,
      subscription: { stripe_subscription_id: null, toss_payment_key: null, status: 'active' },
    });

    const res = await POST(makeReq({ reason: '테스트' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('실패');
  });

  it('Stripe API 예외 발생 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({
      existingRefund: null,
      paymentEvent: PAYMENT_EVENT,
      subscription: STRIPE_SUB,
    });

    mockInvoicesList.mockRejectedValue(new Error('Stripe network error'));

    const res = await POST(makeReq({ reason: '에러 테스트' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('오류');
  });

  it('reason 필드 없이 요청해도 기본값으로 처리', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({
      existingRefund: null,
      paymentEvent: PAYMENT_EVENT,
      subscription: STRIPE_SUB,
    });
    mockInvoicesList.mockResolvedValue({
      data: [{ payment_intent: 'pi_test_123' }],
    });

    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
  });

  it('구독 정보 없음 (DB에 사용자 구독 없음) → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-1'));
    setupAdminMock({
      existingRefund: null,
      paymentEvent: PAYMENT_EVENT,
      subscription: null,
    });

    const res = await POST(makeReq({ reason: '테스트' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('실패');
  });
});
