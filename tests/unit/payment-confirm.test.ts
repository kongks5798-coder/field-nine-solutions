import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({ log: { debug:vi.fn(),info:vi.fn(),warn:vi.fn(),error:vi.fn(),api:vi.fn(),security:vi.fn(),billing:vi.fn(),auth:vi.fn() } }));

vi.mock('@/lib/email', () => ({
  sendPaymentSuccessEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockGetSession = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

// Mock next/headers cookies()
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

// Mock admin client — handles profiles.upsert, subscriptions.upsert,
// billing_events.insert, user_tokens select+upsert, auth.admin.getUserById
const mockAdminFrom = vi.fn(() => ({
  upsert:  vi.fn().mockResolvedValue({ error: null }),
  insert:  vi.fn().mockResolvedValue({ error: null }),
  select:  vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));
const mockGetUserById = vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } });

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from:  mockAdminFrom,
    auth:  { admin: { getUserById: mockGetUserById } },
  })),
}));

import { GET } from '@/app/api/payment/confirm/route';

function makeReq(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/payment/confirm");
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  return new NextRequest(url.toString(), { method: "GET" });
}

const VALID_PARAMS = { paymentKey: "pk_test", orderId: "order-1", amount: "39000", plan: "pro" };

function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }
const NO_SESSION = { data: { session: null } };

describe('GET /api/payment/confirm', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('amount=100으로 pro plan 획득 시도 → amount_mismatch 리다이렉트', async () => {
    // 보안: 공격자가 100원 결제 후 plan=pro 획득 시도 차단
    const res = await GET(makeReq({ ...VALID_PARAMS, amount: "100", plan: "pro" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("amount_mismatch");
  });

  it('pro plan 정가(49000) 금액도 허용', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    mockAdminFrom.mockReturnValue({
      upsert:  vi.fn().mockResolvedValue({ error: null }),
      insert:  vi.fn().mockResolvedValue({ error: null }),
      select:  vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }), single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })),
    });
    const res = await GET(makeReq({ ...VALID_PARAMS, amount: "49000", plan: "pro" }));
    const loc = res.headers.get("location") ?? "";
    expect(loc).not.toContain("amount_mismatch");
  });

  it('redirects to /pricing?error=invalid_plan when plan is admin', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    const res = await GET(makeReq({ ...VALID_PARAMS, plan: "admin" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("invalid_plan");
  });

  it('redirects to /pricing?error=invalid_plan when plan is enterprise', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    const res = await GET(makeReq({ ...VALID_PARAMS, plan: "enterprise" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("invalid_plan");
  });

  it('accepts pro plan and proceeds past plan validation', async () => {
    // When TOSSPAYMENTS_SECRET_KEY is set, it will try to call Toss API.
    // We test that plan=pro passes the allowlist check (no invalid_plan redirect).
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    mockAdminFrom.mockReturnValue({
      upsert:  vi.fn().mockResolvedValue({ error: null }),
      insert:  vi.fn().mockResolvedValue({ error: null }),
      select:  vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }), single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })),
    });
    const res = await GET(makeReq({ ...VALID_PARAMS, plan: "pro" }));
    // Should NOT redirect to invalid_plan
    const loc = res.headers.get("location") ?? "";
    expect(loc).not.toContain("invalid_plan");
  });

  it('accepts team plan and proceeds past plan validation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    mockAdminFrom.mockReturnValue({
      upsert:  vi.fn().mockResolvedValue({ error: null }),
      insert:  vi.fn().mockResolvedValue({ error: null }),
      select:  vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }), single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })),
    });
    const res = await GET(makeReq({ ...VALID_PARAMS, plan: "team", amount: "99000" }));
    const loc = res.headers.get("location") ?? "";
    expect(loc).not.toContain("invalid_plan");
  });

  it('redirects to /login when unauthenticated after plan check', async () => {
    // plan=pro passes, but no session -> redirect to /login
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq({ ...VALID_PARAMS, plan: "pro" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});
