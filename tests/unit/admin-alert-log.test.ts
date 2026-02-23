// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks --
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({
  requireAdmin: mocks.requireAdmin,
}));

import { GET } from '@/app/api/admin-alert-log/route';

// -- Auth result constants --
const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
  }),
};

function makeReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin-alert-log');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

// -- Tests --
describe('GET /api/admin-alert-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  });

  it('인증 실패 → 401 반환', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → 200 + 빈 로그 반환', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('응답 JSON 구조에 logs, total 존재', async () => {
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('total');
  });

  it('requireAdmin이 요청 객체와 함께 호출됨', async () => {
    const req = makeReq();
    await GET(req);
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.requireAdmin).toHaveBeenCalledWith(req);
  });

  it('쿼리 파라미터가 있어도 stub 응답 동일', async () => {
    const res = await GET(makeReq({ page: '3', severity: 'critical' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
    expect(body.total).toBe(0);
  });
});
