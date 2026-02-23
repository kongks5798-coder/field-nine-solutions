// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks --
const mocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mocks.mockGetSession },
  })),
}));

import { GET } from '@/app/api/get-chat-logs/route';

// -- Helpers --
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/get-chat-logs');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

// -- Tests --
describe('GET /api/get-chat-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → 200 + 빈 로그 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('응답 JSON 구조에 logs, total 필드 존재', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('total');
  });

  it('쿼리 파라미터가 있어도 stub 응답 동일', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeReq({ page: '2', limit: '10' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('세션 존재 시 getSession 호출 확인', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-2'));
    await GET(makeReq());
    expect(mocks.mockGetSession).toHaveBeenCalledOnce();
  });
});
