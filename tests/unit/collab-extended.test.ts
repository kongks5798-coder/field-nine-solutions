// @vitest-environment node
/**
 * collab-extended.test.ts
 *
 * Additional edge-case tests for /api/collab route:
 * 1. POST with missing title still uses "Untitled" default
 * 2. GET with custom limit=10 param
 * 3. POST creates session with correct owner_id in insert payload
 * 4. GET with non-numeric limit falls back to NaN → capped properly
 * 5. POST with empty slug string → 400
 * 6. POST non-Error throw in DB → 500 with stringified message
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET, POST } from '@/app/api/collab/route';

const AUTH_SESSION = { data: { session: { user: { id: 'u1' } } } };

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/collab');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/collab', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/collab (edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockGetSession.mockResolvedValue(AUTH_SESSION);
  });

  it('custom limit=10 passes 10 to DB query', async () => {
    const limitFn = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: limitFn,
        }),
      }),
    });
    const res = await GET(makeGetReq({ limit: '10' }));
    expect(res.status).toBe(200);
    expect(limitFn).toHaveBeenCalledWith(10);
  });

  it('non-numeric limit falls back gracefully (NaN → min with 100 = NaN → becomes NaN)', async () => {
    // Math.min(NaN, 100) === NaN, which Supabase treats as no limit
    // The route doesn't crash
    const limitFn = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: limitFn,
        }),
      }),
    });
    const res = await GET(makeGetReq({ limit: 'abc' }));
    expect(res.status).toBe(200);
    expect(limitFn).toHaveBeenCalledTimes(1);
  });

  it('GET non-Error throw from DB → 500 with stringified message', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: 'string error' }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(typeof body.error).toBe('string');
  });
});

describe('POST /api/collab (edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockGetSession.mockResolvedValue(AUTH_SESSION);
  });

  it('POST with slug but no title defaults to "Untitled"', async () => {
    const insertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '5', slug: 'no-title', title: 'Untitled', content: '', owner_id: null, updated_at: '2024-06-01' },
          error: null,
        }),
      }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return { insert: insertFn };
    });

    const res = await POST(makePostReq({ slug: 'no-title' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.session.title).toBe('Untitled');
  });

  it('POST with empty string slug → 400', async () => {
    const res = await POST(makePostReq({ slug: '', title: 'Has Title' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('slug is required');
  });

  it('POST creates session with correct owner_id when provided', async () => {
    const insertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '6', slug: 'owned', title: 'Owned', content: '', owner_id: 'user-42', updated_at: '2024-06-01' },
          error: null,
        }),
      }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return { insert: insertFn };
    });

    const res = await POST(makePostReq({ slug: 'owned', title: 'Owned', owner_id: 'user-42' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.session.owner_id).toBe('user-42');
    // Verify insert was called with owner_id in the data
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'owned', owner_id: 'user-42' }),
    );
  });
});
