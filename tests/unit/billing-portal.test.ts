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
  const portalCreate = vi.fn();
  const MockStripe = function(this: unknown) {
    return {
      billingPortal: { sessions: { create: portalCreate } },
    };
  };
  MockStripe.prototype = {};
  (MockStripe as unknown as Record<string, unknown>).__mocks__ = { portalCreate };
  return { default: MockStripe };
});

import Stripe from 'stripe';
import { POST } from '@/app/api/billing/portal/route';

function getMockPortalCreate() {
  return ((Stripe as unknown as Record<string, unknown>).__mocks__ as { portalCreate: ReturnType<typeof vi.fn> }).portalCreate;
}

function makeReq() {
  return new NextRequest('http://localhost/api/billing/portal', { method: 'POST' });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

describe('POST /api/billing/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('STRIPE_SECRET_KEY 없으면 → 503 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('Stripe');
  });

  it('stripe_customer_id 없으면 → 404 반환', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: null } }),
        }),
      }),
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(404);
  });

  it('성공 → Billing Portal URL 반환', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' } }),
        }),
      }),
    });
    getMockPortalCreate().mockResolvedValue({ url: 'https://billing.stripe.com/session/test' });
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://billing.stripe.com/session/test');
  });
});
