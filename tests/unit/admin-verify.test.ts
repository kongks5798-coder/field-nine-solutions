// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));

import { GET } from '@/app/api/admin/verify/route';

function makeReq() {
  return new NextRequest('http://localhost/api/admin/verify', { method: 'GET' });
}

const AUTH_OK = { ok: true as const };
function authFail401() {
  return {
    ok: false as const,
    response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  };
}
function authFail500() {
  return {
    ok: false as const,
    response: new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 }),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
});

describe('GET /api/admin/verify', () => {
  it('returns 200 with ok:true when admin auth succeeds', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('returns 401 when auth cookie is missing or invalid', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(authFail401());
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when JWT_SECRET is not configured', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(authFail500());
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Server misconfigured');
  });

  it('calls requireAdmin with the request object', async () => {
    const req = makeReq();
    await GET(req);
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.requireAdmin).toHaveBeenCalledWith(req);
  });

  it('does not return ok field when auth fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(authFail401());
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.ok).toBeUndefined();
  });
});
