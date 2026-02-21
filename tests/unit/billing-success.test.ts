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

// Stripe mock — use a module-level holder so the constructor can lazily call it
// The holder is defined inside vi.mock() factory scope to avoid hoisting issues.
vi.mock('stripe', () => {
  const stripeMocks = { retrieve: vi.fn() };
  // Expose the mocks on the module for test access
  const MockStripe = function MockStripe(this: unknown) {
    return {
      checkout: { sessions: { retrieve: stripeMocks.retrieve } },
    };
  };
  MockStripe.prototype = {};
  // Attach mocks to the constructor for test access via __mocks__
  (MockStripe as unknown as Record<string,unknown>).__mocks__ = stripeMocks;
  return { default: MockStripe };
});

// Import the mocked Stripe to access __mocks__
import Stripe from 'stripe';
import { GET } from '@/app/api/billing/success/route';

// Helper to get the retrieve mock from the Stripe mock
function getMockRetrieve() {
  return ((Stripe as unknown as Record<string,unknown>).__mocks__ as { retrieve: ReturnType<typeof vi.fn> }).retrieve;
}

function makeReq(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/billing/success");
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  return new NextRequest(url.toString(), { method: "GET" });
}

function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }
const NO_SESSION = { data: { session: null } };

describe('GET /api/billing/success', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('redirects to /pricing?error=invalid when no session_id', async () => {
    const res = await GET(makeReq({}));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/pricing?error=invalid");
  });

  it('redirects to /login when not authenticated', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq({ session_id: "cs_test_abc" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it('redirects to /pricing?error=forbidden when Stripe uid !== session uid (IDOR prevention)', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    getMockRetrieve().mockResolvedValue({
      payment_status: "paid",
      metadata: { supabase_uid: "attacker-uid", plan: "pro" },
    });
    const res = await GET(makeReq({ session_id: "cs_test_abc" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/pricing?error=forbidden");
  });

  it('redirects to /workspace?welcome=1 on success', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    getMockRetrieve().mockResolvedValue({
      payment_status: "paid",
      metadata: { supabase_uid: "user-123", plan: "pro" },
    });
    mockUpsert.mockResolvedValue({ error: null });
    const res = await GET(makeReq({ session_id: "cs_test_abc" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/workspace?welcome=1");
  });

  it('accepts only pro or team plans — uses pro as default for unknown plan', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    getMockRetrieve().mockResolvedValue({
      payment_status: "paid",
      metadata: { supabase_uid: "user-123", plan: "enterprise" },
    });
    mockUpsert.mockResolvedValue({ error: null });
    const res = await GET(makeReq({ session_id: "cs_test_abc" }));
    // plan defaults to "pro" — should still succeed
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/workspace?welcome=1");
  });
});