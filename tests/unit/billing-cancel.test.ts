import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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
  const s = {
    cancelSub: vi.fn(),
    updateSub: vi.fn(),
    listInvoices: vi.fn().mockResolvedValue({ data: [] }),
    createRefund: vi.fn(),
  };
  const MockStripe = function(this: unknown) {
    return {
      subscriptions: { cancel: s.cancelSub, update: s.updateSub },
      invoices: { list: s.listInvoices },
      refunds: { create: s.createRefund },
    };
  };
  MockStripe.prototype = {};
  (MockStripe as unknown as Record<string, unknown>).__mocks__ = s;
  return { default: MockStripe };
});

import { POST } from '@/app/api/billing/cancel/route';

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

// 기간 설정: 오늘부터 30일 뒤 만료, 시작은 오늘
const now = new Date();
const periodStart = now.toISOString();
const periodEnd = new Date(now.getTime() + 30 * 86400000).toISOString();

const BASE_SUB = {
  id: 'sub-1',
  user_id: 'u1',
  plan: 'pro',
  status: 'active',
  stripe_subscription_id: 'stripe_sub_1',
  discounted_price: 9900,
  current_period_start: periodStart,
  current_period_end: periodEnd,
};

function makeReq(body: unknown = {}) {
  return new NextRequest('http://localhost/api/billing/cancel', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function setupMockChain(sub: unknown, usageRows: unknown = []) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    const call = callCount;
    if (call === 1) {
      // subscriptions query
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: sub }),
            }),
          }),
        }),
      };
    }
    if (call === 2) {
      // usage_records query
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: usageRows }),
            }),
          }),
        }),
      };
    }
    // subscriptions update, profiles upsert, billing_events insert
    return {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
  });
}

describe('POST /api/billing/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it('활성 구독 없음 → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(null);
    const res = await POST(makeReq());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('활성 구독 없음');
  });

  it('preview=true → 취소 없이 환불 예측만 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(BASE_SUB);
    const res = await POST(makeReq({ preview: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('remainDays');
    expect(body).toHaveProperty('baseRefund');
    expect(body).toHaveProperty('refundAmount');
    expect(body).toHaveProperty('plan');
    // 실제 취소가 아님 — success 필드 없음
    expect(body.success).toBeUndefined();
  });

  it('preview=true → remainDays는 0 이상', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(BASE_SUB);
    const res = await POST(makeReq({ preview: true }));
    const body = await res.json();
    expect(body.remainDays).toBeGreaterThanOrEqual(0);
    expect(body.totalDays).toBeGreaterThanOrEqual(1);
  });

  it('pro 플랜은 AI 호출 초과 없음 (Infinity quota)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const usageRows = [
      { type: 'ai_call', quantity: 1000, unit_price: 90 },
    ];
    setupMockChain(BASE_SUB, usageRows);
    const res = await POST(makeReq({ preview: true }));
    const body = await res.json();
    // pro plan has Infinity quota, so overage = max(0, 1000 - Infinity) = 0
    expect(body.overageAmount).toBe(0);
    expect(body.aiOverage).toBe(0);
  });

  it('환불액 있을 때 취소 → success: true 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    // discounted_price = 9900, 30일 남은 경우 baseRefund = 9900
    setupMockChain(BASE_SUB);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.refundAmount).toBeGreaterThanOrEqual(0);
  });

  it('만료된 구독 (periodEnd 과거) → refundAmount = 0', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const pastSub = {
      ...BASE_SUB,
      current_period_end: new Date(Date.now() - 5 * 86400000).toISOString(),
    };
    setupMockChain(pastSub);
    const res = await POST(makeReq({ preview: true }));
    const body = await res.json();
    expect(body.refundAmount).toBe(0);
    expect(body.remainDays).toBe(0);
  });
});
