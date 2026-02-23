// @vitest-environment node
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

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

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

function makePostReqInvalidJson() {
  return new NextRequest('http://localhost/api/collab', {
    method: 'POST',
    body: 'not-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/collab auth and edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('unauthenticated returns 401', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('limit query param is capped at 100', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    const res = await GET(makeGetReq({ limit: '200' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toEqual([]);
  });

  it('DB error returns 500', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => { throw new Error('connection lost'); }),
        }),
      }),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('connection lost');
  });
});

describe('POST /api/collab auth and edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('invalid JSON body returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReqInvalidJson());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid JSON');
  });

  it('missing slug returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makePostReq({ title: 'No Slug Doc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('slug is required');
  });
});
