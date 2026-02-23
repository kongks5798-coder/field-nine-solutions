// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks --
const mocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mocks.mockGetSession },
  })),
}));

vi.mock('@/utils/supabase/admin', () => ({
  admin: { from: mocks.mockFrom },
}));

import { GET, POST } from '@/app/api/quality-settings-history/route';

// -- Helpers --
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeGetReq(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/quality-settings-history');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body?: unknown) {
  return new NextRequest('http://localhost/api/quality-settings-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { setting_key: 'threshold', old_value: 0.7, new_value: 0.8 }),
  });
}

/** Chain mock for select with count */  
function mockSelectChain(data: unknown[] | null, count: number | null = 0, error: { message: string } | null = null) {
  const result = { data, error, count };
  const chainEnd = {
    eq: vi.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  Object.assign(chainEnd, result);
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockReturnValue(chainEnd),
      }),
    }),
  };
}

// -- GET Tests --
describe('GET /api/quality-settings-history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFrom.mockReturnValue(mockSelectChain([], 0));
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('인증 성공 → 200 + 빈 이력 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('응답 JSON 구조에 logs, total 존재', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await GET(makeGetReq());
    const body = await res.json();
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('total');
  });
});

// -- POST Tests --
describe('POST /api/quality-settings-history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'h1', setting_key: 'threshold' }, error: null }),
        }),
      }),
    });
  });

  it('미인증 → 401 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makePostReq());
    expect(res.status).toBe(401);
  });

  it('setting_key 없음 → 400 반환', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('setting_key');
  });

  it('인증 성공 + 유효한 body → 200 + 이력 저장 메시지', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await POST(makePostReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('이력');
  });

  it('getSession 호출 확인', async () => {
    mocks.mockGetSession.mockResolvedValue(sessionOf('user-1'));
    await POST(makePostReq());
    expect(mocks.mockGetSession).toHaveBeenCalledOnce();
  });
});