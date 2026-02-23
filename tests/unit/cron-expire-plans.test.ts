// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/cron/expire-plans/route';

function makeReq(authHeader?: string) {
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;
  return new NextRequest('http://localhost/api/cron/expire-plans', { method: 'GET', headers });
}

// Helper: build chained mock for profiles query
function mockProfilesQuery(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      not: vi.fn().mockReturnValue({
        lt: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

// Helper: build chained mock for subscriptions query (maybeSingle)
function mockSubsQuery(result: { data: unknown; error?: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue(result),
            }),
          }),
        }),
      }),
    }),
  };
}

// Helper: build chained mock for profile update
function mockProfileUpdate() {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

// Helper: build chained mock for subscription update
function mockSubUpdate() {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  };
}

// Helper: build chained mock for billing_events insert
function mockBillingInsert() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe('GET /api/cron/expire-plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('CRON_SECRET 미설정 → 503 반환', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Cron not configured');
  });

  it('잘못된 Bearer 토큰 → 401 반환', async () => {
    const res = await GET(makeReq('Bearer wrong-secret'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('Authorization 헤더 없음 → 401 반환', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('만료된 플랜 없음 → expired: 0 반환', async () => {
    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: [], error: null })
    );
    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expired).toBe(0);
    expect(body.message).toContain('만료된 플랜 없음');
  });

  it('만료된 플랜 null → expired: 0 반환', async () => {
    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: null, error: null })
    );
    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expired).toBe(0);
  });

  it('DB 조회 오류 → 500 반환', async () => {
    mockFrom.mockReturnValue(
      mockProfilesQuery({ data: null, error: { message: 'DB error' } })
    );
    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Expire plans query failed');
  });

  it('만료된 플랜 있고 Stripe 구독 없음 → 강등 처리', async () => {
    const expiredProfiles = [
      { id: 'user-1', plan: 'pro', plan_expires_at: '2024-01-01T00:00:00Z' },
    ];

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      callCount++;
      if (callCount === 1) {
        // First call: profiles select (expired plans query)
        return mockProfilesQuery({ data: expiredProfiles, error: null });
      }
      if (table === 'subscriptions' && callCount === 2) {
        // Second call: subscriptions select (Stripe check) - no active sub
        return mockSubsQuery({ data: null });
      }
      if (table === 'profiles') {
        // profiles update
        return mockProfileUpdate();
      }
      if (table === 'subscriptions') {
        // subscriptions update
        return mockSubUpdate();
      }
      if (table === 'billing_events') {
        return mockBillingInsert();
      }
      return mockProfileUpdate(); // fallback
    });

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expired).toBe(1);
    expect(body.total).toBe(1);
    expect(body.message).toContain('1명');
  });

  it('만료된 플랜 있지만 Stripe 구독 활성 → 건너뜀', async () => {
    const expiredProfiles = [
      { id: 'user-1', plan: 'pro', plan_expires_at: '2024-01-01T00:00:00Z' },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockProfilesQuery({ data: expiredProfiles, error: null });
      }
      // Stripe sub exists → skip
      return mockSubsQuery({ data: { id: 'sub-stripe-1' } });
    });

    const res = await GET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expired).toBe(0);
    expect(body.total).toBe(1);
  });
});
