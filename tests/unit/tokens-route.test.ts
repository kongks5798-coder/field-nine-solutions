import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));

vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

const mockRpc = vi.fn();
const mockAdminFrom = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ rpc: mockRpc, from: mockAdminFrom })),
}));

import { GET, PATCH } from '@/app/api/tokens/route';

function makeReq(method: string, body?: object) {
  if (body) {
    return new NextRequest('http://localhost/api/tokens', {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new NextRequest('http://localhost/api/tokens', { method });
}

const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

describe('GET /api/tokens', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 시 기본 잔액(50000) 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(50000);
  });

  it('인증된 사용자의 토큰 잔액 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { balance: 42000 } }),
        }),
      }),
    });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(42000);
  });

  it('최초 사용자 — DB에 데이터 없으면 upsert 후 기본 잔액 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('new-user'));
    const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
    // select().eq().single() returns no data (first-time user)
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_tokens') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: mockUpsert,
        };
      }
      return {};
    });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(50000);
  });
});

describe('PATCH /api/tokens', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('미인증 시 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await PATCH(makeReq('PATCH', { delta: -100 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('delta 누락 시 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await PATCH(makeReq('PATCH', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/negative integer/i);
  });

  it('양수 delta 거부 — 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user-1'));
    const res = await PATCH(makeReq('PATCH', { delta: 500 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/negative integer/i);
  });
});
