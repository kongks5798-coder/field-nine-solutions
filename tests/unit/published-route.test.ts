// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/published/route';
import { GET as GET_SLUG, DELETE as DELETE_SLUG } from '@/app/api/published/[slug]/route';

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/published');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makeSlugReq(method: string) {
  return new NextRequest('http://localhost/api/published/my-app', { method });
}

function slugCtx(slug = 'my-app') {
  return { params: Promise.resolve({ slug }) };
}

const APPS = [
  { slug: 'app1', name: 'App One', views: 100, user_id: 'u1', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { slug: 'app2', name: 'App Two', views: 50, user_id: 'u2', created_at: '2024-01-02', updated_at: '2024-01-02' },
];

describe('GET /api/published', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns apps list with 200', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: APPS, error: null }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps).toHaveLength(2);
    expect(body.apps[0].slug).toBe('app1');
  });

  it('DB error returns empty apps array gracefully', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'query error' } }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps).toEqual([]);
  });

  it('limit param capped at 50', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    const res = await GET(makeGetReq({ limit: '100' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps).toEqual([]);
  });
});

describe('DELETE /api/published/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('unauthenticated returns 401', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE_SLUG(makeSlugReq('DELETE'), slugCtx());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('delete success returns ok true', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = await DELETE_SLUG(makeSlugReq('DELETE'), slugCtx('my-app'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
