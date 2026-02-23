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

import { DELETE } from '@/app/api/domains/[id]/route';

function makeReq() {
  return new NextRequest('http://localhost/api/domains/dom1', { method: 'DELETE' });
}
function ctx(id = 'dom1') {
  return { params: Promise.resolve({ id }) };
}

const MOCK_SESSION = {
  data: { session: { user: { id: 'user1' } } },
};
const NO_SESSION = {
  data: { session: null },
};

beforeEach(() => {
  vi.resetAllMocks();
  mockGetSession.mockResolvedValue(MOCK_SESSION);
  mockFrom.mockReturnValue({
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ error: null }),
      }),
    }),
  });
});

describe('DELETE /api/domains/[id]', () => {
  it('returns 200 on successful deletion', async () => {
    const res = await DELETE(makeReq(), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValueOnce(NO_SESSION);
    const res = await DELETE(makeReq(), ctx());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when supabase delete fails', async () => {
    mockFrom.mockReturnValueOnce({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: { message: 'DB error' } }),
        }),
      }),
    });
    const res = await DELETE(makeReq(), ctx());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('DB error');
  });

  it('calls from with domains table', async () => {
    await DELETE(makeReq(), ctx());
    expect(mockFrom).toHaveBeenCalledWith('domains');
  });

  it('scopes delete to the authenticated user', async () => {
    const mockEqUser = vi.fn().mockReturnValue({ error: null });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockDel = vi.fn().mockReturnValue({ eq: mockEqId });
    mockFrom.mockReturnValueOnce({ delete: mockDel });
    await DELETE(makeReq(), ctx('dom99'));
    expect(mockEqId).toHaveBeenCalledWith('id', 'dom99');
    expect(mockEqUser).toHaveBeenCalledWith('user_id', 'user1');
  });
});
