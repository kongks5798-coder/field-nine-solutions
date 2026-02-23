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

import { GET } from '@/app/api/ai-quality-alert/route';

// -- Helpers --
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/ai-quality-alert');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

// -- Tests --
describe('GET /api/ai-quality-alert', () => {
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

  it('인증 성공 → 200 + 빈 알림 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alerts).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('응답에 suggestion 필드 포함', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body).toHaveProperty('suggestion');
    expect(body.suggestion).toBe('');
  });

  it('응답 JSON 구조에 alerts, total, suggestion 존재', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeReq());
    const body = await res.json();
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(['alerts', 'total', 'suggestion'])
    );
  });

  it('getSession 호출 확인', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    await GET(makeReq());
    expect(mocks.mockGetSession).toHaveBeenCalledOnce();
  });
});
