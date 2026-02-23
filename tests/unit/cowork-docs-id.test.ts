// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn().mockReturnValue([]) }),
}));

const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

import { GET, PATCH, DELETE } from '@/app/api/cowork/docs/[id]/route';

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(method: string, body?: unknown) {
  const headers: Record<string, string> = {};
  let reqBody: string | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    reqBody = JSON.stringify(body);
  }
  return new NextRequest('http://localhost/api/cowork/docs/d1', { method, headers, body: reqBody });
}

function ctx(id = 'd1') {
  return { params: Promise.resolve({ id }) };
}

const DOC = {
  id: 'd1', title: 'My Doc', emoji: '\ud83d\udcc4', content: 'Hello World',
  user_id: 'user-1', is_shared: false, created_at: '2024-01-01', updated_at: '2024-01-01',
};

describe('GET /api/cowork/docs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('unauthenticated returns 401', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'), ctx());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns doc on success', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: DOC, error: null }),
          }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'), ctx('d1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc.title).toBe('My Doc');
  });
});

describe('PATCH /api/cowork/docs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('title update returns 200', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const updated = { id: 'd1', title: 'Updated', emoji: '\ud83d\udcc4', is_shared: false, updated_at: '2024-01-02' };
    mockAdminFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      }),
    });
    const res = await PATCH(makeReq('PATCH', { title: 'Updated' }), ctx('d1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc.title).toBe('Updated');
  });

  it('unknown field in strict schema returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await PATCH(makeReq('PATCH', { title: 'Test', invalidField: true }), ctx('d1'));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/cowork/docs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('delete success returns ok true', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), ctx('d1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
