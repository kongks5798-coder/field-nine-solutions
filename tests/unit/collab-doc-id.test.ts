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

import { DELETE } from '@/app/api/cowork/docs/[id]/route';

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/cowork/docs/d1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function ctx(id = 'd1') {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/cowork/docs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await DELETE(makeReq('DELETE'), ctx());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with { ok: true } on successful delete', async () => {
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

  it('returns 500 when database deletion fails', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockAdminFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
        }),
      }),
    });
    const res = await DELETE(makeReq('DELETE'), ctx('d1'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to delete document');
  });

  it('passes the correct document id to the query', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const eqInner = vi.fn().mockResolvedValue({ error: null });
    const eqOuter = vi.fn().mockReturnValue({ eq: eqInner });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqOuter });
    mockAdminFrom.mockReturnValue({ delete: deleteFn });

    await DELETE(makeReq('DELETE'), ctx('doc-xyz'));
    expect(mockAdminFrom).toHaveBeenCalledWith('cowork_docs');
    expect(eqOuter).toHaveBeenCalledWith('id', 'doc-xyz');
  });

  it('passes the session user_id to scope deletion', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-42'));
    const eqInner = vi.fn().mockResolvedValue({ error: null });
    const eqOuter = vi.fn().mockReturnValue({ eq: eqInner });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqOuter });
    mockAdminFrom.mockReturnValue({ delete: deleteFn });

    await DELETE(makeReq('DELETE'), ctx('d1'));
    expect(eqInner).toHaveBeenCalledWith('user_id', 'user-42');
  });
});
