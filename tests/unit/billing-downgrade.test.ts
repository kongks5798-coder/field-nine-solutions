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
  const mockUpdate = vi.fn().mockResolvedValue({});
  function MockStripe() {
    return { subscriptions: { update: mockUpdate } };
  }
  (MockStripe as unknown as Record<string, unknown>).__mockUpdate = mockUpdate;
  return { default: MockStripe };
});

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), billing: vi.fn() },
}));

import { POST } from '@/app/api/billing/downgrade/route';

// ── 헬퍼 ──
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(body: unknown = {}) {
  return new NextRequest('http://localhost/api/billing/downgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_SUB = {
  id: 'sub-1',
  plan: 'pro',
  status: 'active',
  stripe_subscription_id: 'stripe_sub_1',
  toss_payment_key: null,
};

function setupMockChain(sub: unknown) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // subscriptions select → single
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
    // subscriptions update, billing_events insert
    return {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
  });
}

// ── 테스트 ──
describe('POST /api/billing/downgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // global fetch mock for toss cancel
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('활성 구독 없음 → 404 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(null);
    const res = await POST(makeReq());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('활성 구독');
  });

  it('Stripe 구독 다운그레이드 → 성공 메시지 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    setupMockChain(BASE_SUB);
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('무료 플랜');
    expect(body.effectiveDate).toBeDefined();
  });

  it('Toss 결제 키 있는 구독 → Toss 취소 API 호출', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const tossSub = { ...BASE_SUB, stripe_subscription_id: null, toss_payment_key: 'toss_pk_1' };
    setupMockChain(tossSub);
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    // fetch가 Toss cancel API로 호출됨
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('tosspayments.com'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('예외 발생 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    // make the admin client throw
    mockFrom.mockImplementation(() => {
      throw new Error('DB connection failed');
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('오류');
  });
});
