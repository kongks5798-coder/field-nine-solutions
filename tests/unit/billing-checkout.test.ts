import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted: vi.mock 팩토리보다 먼저 실행됨 ──
const mockCustomersCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'cus_test' }));
const mockSessionsCreate  = vi.hoisted(() => vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }));

vi.mock('stripe', () => {
  // Stripe는 class(constructor) → 일반 function으로 mock
  function MockStripe() {
    return {
      customers: { create: mockCustomersCreate },
      checkout:  { sessions: { create: mockSessionsCreate } },
    };
  }
  return { default: MockStripe };
});

const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      upsert: vi.fn().mockResolvedValue({ data: null }),
    })),
  })),
}));

vi.mock('@/lib/env',    () => ({ validateEnv: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), billing: vi.fn() },
}));

import { POST } from '@/app/api/billing/checkout/route';

const SESSION    = { data: { session: { user: { id: 'uid-1', email: 'test@example.com', user_metadata: {} } } } };
const NO_SESSION = { data: { session: null } };

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
  });

  it('비인증 → 401 반환', async () => {
    const res = await POST(makeReq({ plan: 'pro' }));
    expect(res.status).toBe(401);
  });

  it('잘못된 plan → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ plan: 'admin' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/pro|team/);
  });

  it('enterprise plan → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ plan: 'enterprise' }));
    expect(res.status).toBe(400);
  });

  it('provider=polar, URL 미설정 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    delete process.env.POLAR_CHECKOUT_URL_PRO;
    const res = await POST(makeReq({ plan: 'pro', provider: 'polar' }));
    expect(res.status).toBe(400);
  });
});
