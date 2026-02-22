import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ from: mockFrom })),
}));

// Stripe mock — vi.hoisted() to avoid TDZ
vi.mock('stripe', () => {
  const s = {
    create: vi.fn(),
    createItem: vi.fn(),
    finalize: vi.fn(),
    pay: vi.fn(),
  };
  const MockStripe = function(this: unknown) {
    return {
      invoices: {
        create: s.create,
        finalizeInvoice: s.finalize,
        pay: s.pay,
      },
      invoiceItems: { create: s.createItem },
    };
  };
  MockStripe.prototype = {};
  (MockStripe as unknown as Record<string, unknown>).__mocks__ = s;
  return { default: MockStripe };
});

import { GET, POST } from '@/app/api/billing/invoice/route';

function makeReq(method: string, authHeader?: string) {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost/api/billing/invoice', { method, headers });
}

function setupMockFrom(invoices: unknown, profile: unknown, extraMock?: () => void) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    const call = callCount;
    if (call === 1) {
      // monthly_usage query
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gt: vi.fn().mockResolvedValue({ data: invoices, error: null }),
            }),
          }),
        }),
      };
    }
    if (call === 2) {
      // profiles query
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profile }),
          }),
        }),
      };
    }
    // monthly_usage update / billing_events insert
    return {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
  });
}

describe('GET /api/billing/invoice (Cron)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc-key';
    process.env.STRIPE_SECRET_KEY = undefined as unknown as string;
  });

  it('CRON_SECRET 설정 시 Authorization 없으면 401 반환', async () => {
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
  });

  it('잘못된 Authorization → 401 반환', async () => {
    const res = await GET(makeReq('GET', 'Bearer wrong'));
    expect(res.status).toBe(401);
  });

  it('DB 오류 → 500 반환', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET', 'Bearer cron-secret'));
    expect(res.status).toBe(500);
  });

  it('청구 대상 없으면 { success: 0, failed: 0, skipped: 0 } 반환', async () => {
    setupMockFrom([], null);
    const res = await GET(makeReq('GET', 'Bearer cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(0);
    expect(body.failed).toBe(0);
    expect(body.skipped).toBe(0);
  });

  it('스타터 플랜은 skipped 처리', async () => {
    const invoices = [{ id: 'inv-1', user_id: 'u1', amount_krw: 9900, ai_calls: 50 }];
    setupMockFrom(invoices, { stripe_customer_id: 'cus_1', plan: 'starter' });
    const res = await GET(makeReq('GET', 'Bearer cron-secret'));
    const body = await res.json();
    expect(body.skipped).toBe(1);
    expect(body.success).toBe(0);
  });

  it('stripe_customer_id 없으면 skipped 처리', async () => {
    const invoices = [{ id: 'inv-1', user_id: 'u1', amount_krw: 9900, ai_calls: 50 }];
    setupMockFrom(invoices, { stripe_customer_id: null, plan: 'pro' });
    const res = await GET(makeReq('GET', 'Bearer cron-secret'));
    const body = await res.json();
    expect(body.skipped).toBe(1);
  });

  it('POST도 동일하게 작동 (manual trigger)', async () => {
    setupMockFrom([], null);
    const res = await POST(makeReq('POST', 'Bearer cron-secret'));
    expect(res.status).toBe(200);
  });

  it('CRON_SECRET 미설정 시 Authorization 없어도 통과', async () => {
    delete process.env.CRON_SECRET;
    setupMockFrom([], null);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
  });
});
