// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

import { GET, DELETE } from '@/app/api/published/[slug]/route';

function makeReq(method: string) {
  return new NextRequest('http://localhost/api/published/my-app', { method });
}

function slugCtx(slug = 'my-app') {
  return { params: Promise.resolve({ slug }) };
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }

const APP_DATA = { slug: 'my-app', name: 'My App', html: '<html></html>', views: 100, created_at: '2024-01' };

describe('GET /api/published/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 200 with app data for existing slug', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: APP_DATA, error: null }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), slugCtx('my-app'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.app.slug).toBe('my-app');
    expect(body.app.name).toBe('My App');
  });

  it('returns all expected fields in app response', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: APP_DATA, error: null }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), slugCtx('my-app'));
    const body = await res.json();
    expect(body.app).toHaveProperty('slug');
    expect(body.app).toHaveProperty('name');
    expect(body.app).toHaveProperty('html');
    expect(body.app).toHaveProperty('views');
    expect(body.app).toHaveProperty('created_at');
  });

  it('returns 404 for nonexistent slug', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), slugCtx('nonexistent'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
  });

  it('returns 404 when data is null (no error object)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), slugCtx('empty'));
    expect(res.status).toBe(404);
  });

  it('queries the published_apps table', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: APP_DATA, error: null }),
        }),
      }),
    });
    await GET(makeReq('GET'), slugCtx('my-app'));
    expect(mockFrom).toHaveBeenCalledWith('published_apps');
  });
});

describe('DELETE /api/published/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE(makeReq('DELETE'), slugCtx('my-app'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with { ok: true } on successful delete', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), slugCtx('my-app'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 when database delete fails', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), slugCtx('my-app'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to delete published app');
  });

  it('scopes delete by slug and user_id', async () => {
    mockGetSession.mockResolvedValue(sessionOf('owner-99'));
    const eqUserId = vi.fn().mockResolvedValue({ error: null });
    const eqSlug = vi.fn().mockReturnValue({ eq: eqUserId });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqSlug });
    mockFrom.mockReturnValue({ delete: deleteFn });

    await DELETE(makeReq('DELETE'), slugCtx('target-app'));
    expect(eqSlug).toHaveBeenCalledWith('slug', 'target-app');
    expect(eqUserId).toHaveBeenCalledWith('user_id', 'owner-99');
  });
});
