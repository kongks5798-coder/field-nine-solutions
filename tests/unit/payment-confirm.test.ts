import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({ log: { debug:vi.fn(),info:vi.fn(),warn:vi.fn(),error:vi.fn(),api:vi.fn(),security:vi.fn(),billing:vi.fn(),auth:vi.fn() } }));

const mockGetSession = vi.fn();
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: vi.fn(() => ({ upsert: mockUpsert })),
  })),
}));

// Mock next/headers cookies()
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

import { GET } from '@/app/api/payment/confirm/route';

function makeReq(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/payment/confirm");
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  return new NextRequest(url.toString(), { method: "GET" });
}

const VALID_PARAMS = { paymentKey: "pk_test", orderId: "order-1", amount: "9900", plan: "pro" };

function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }
const NO_SESSION = { data: { session: null } };

describe('GET /api/payment/confirm', () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
    // The route will reach the Toss confirmation step; we intercept via global fetch mock.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    mockUpsert.mockResolvedValue({ error: null });
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
    mockUpsert.mockResolvedValue({ error: null });
    const res = await GET(makeReq({ ...VALID_PARAMS, plan: "team" }));
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