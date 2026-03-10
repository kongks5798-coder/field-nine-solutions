// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mock fns ─────────────────────────────────────────────────────────
const mockGetSession = vi.hoisted(() => vi.fn());
const mockFrom       = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from:  mockFrom,
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { GET } from '@/app/api/user/stats/route';

// ── Fixtures ─────────────────────────────────────────────────────────────────
const SESSION = {
  data: { session: { user: { id: 'user-xyz', email: 'user@example.com' } } },
};
const NO_SESSION = { data: { session: null } };

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/user/stats', { method: 'GET' });
}

/** Builds a chainable Supabase query mock that resolves with `result`. */
function makeQueryChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'gte', 'limit'];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  (chain as { then?: unknown }).then = undefined; // not a thenable itself
  // The final awaited call is the chain object itself resolving via Promise.all
  // We expose a mockResolvedValue helper so tests can override per-call
  return { chain, resolve: (val: unknown) => { Object.assign(chain, Promise.resolve(val)); } };
}

describe('GET /api/user/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth ──────────────────────────────────────────────────────────
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  // ── Happy path ────────────────────────────────────────────────────
  it('returns stats object with expected keys', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const appsData = [
      { slug: 'app-1', name: 'App One', views: 100, likes: 10, created_at: '2026-01-01T00:00:00Z' },
      { slug: 'app-2', name: 'App Two', views: 50,  likes: 5,  created_at: '2026-01-10T00:00:00Z' },
    ];

    // Promise.all resolves two queries in parallel — mock `from` per call
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: all apps query
        return {
          select:  vi.fn().mockReturnThis(),
          eq:      vi.fn().mockReturnThis(),
          order:   vi.fn().mockResolvedValue({ data: appsData, error: null }),
        };
      }
      // Second call: weekly count query
      return {
        select:  vi.fn().mockReturnThis(),
        eq:      vi.fn().mockReturnThis(),
        gte:     vi.fn().mockResolvedValue({ data: null, error: null, count: 1 }),
      };
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalApps');
    expect(body).toHaveProperty('totalViews');
    expect(body).toHaveProperty('totalLikes');
    expect(body).toHaveProperty('weeklyCreated');
    expect(body).toHaveProperty('topApps');
  });

  it('stats values are non-negative numbers', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const appsData = [
      { slug: 'app-a', name: 'A', views: 42, likes: 3, created_at: '2026-02-01T00:00:00Z' },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select:  vi.fn().mockReturnThis(),
          eq:      vi.fn().mockReturnThis(),
          order:   vi.fn().mockResolvedValue({ data: appsData, error: null }),
        };
      }
      return {
        select:  vi.fn().mockReturnThis(),
        eq:      vi.fn().mockReturnThis(),
        gte:     vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      };
    });

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.totalApps).toBeGreaterThanOrEqual(0);
    expect(body.totalViews).toBeGreaterThanOrEqual(0);
    expect(body.totalLikes).toBeGreaterThanOrEqual(0);
    expect(body.weeklyCreated).toBeGreaterThanOrEqual(0);
    expect(typeof body.totalApps).toBe('number');
    expect(typeof body.totalViews).toBe('number');
    expect(typeof body.totalLikes).toBe('number');
  });

  it('topApps is an array of at most 3 items', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const appsData = Array.from({ length: 5 }, (_, i) => ({
      slug: `app-${i}`, name: `App ${i}`, views: 100 - i * 10, likes: i, created_at: '2026-01-01T00:00:00Z',
    }));

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select:  vi.fn().mockReturnThis(),
          eq:      vi.fn().mockReturnThis(),
          order:   vi.fn().mockResolvedValue({ data: appsData, error: null }),
        };
      }
      return {
        select:  vi.fn().mockReturnThis(),
        eq:      vi.fn().mockReturnThis(),
        gte:     vi.fn().mockResolvedValue({ data: null, error: null, count: 2 }),
      };
    });

    const res = await GET(makeReq());
    const body = await res.json();
    expect(Array.isArray(body.topApps)).toBe(true);
    expect(body.topApps.length).toBeLessThanOrEqual(3);
  });

  it('handles empty apps list — all counts are 0', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select:  vi.fn().mockReturnThis(),
          eq:      vi.fn().mockReturnThis(),
          order:   vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select:  vi.fn().mockReturnThis(),
        eq:      vi.fn().mockReturnThis(),
        gte:     vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      };
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalApps).toBe(0);
    expect(body.totalViews).toBe(0);
    expect(body.totalLikes).toBe(0);
    expect(body.topApps).toHaveLength(0);
  });

  it('returns 500 on unexpected DB error', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    mockFrom.mockImplementation(() => ({
      select:  vi.fn().mockReturnThis(),
      eq:      vi.fn().mockReturnThis(),
      order:   vi.fn().mockRejectedValue(new Error('unexpected DB failure')),
      gte:     vi.fn().mockRejectedValue(new Error('unexpected DB failure')),
    }));

    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });
});
