// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// vi.hoisted mocks
const mockGetSession = vi.hoisted(() => vi.fn());
const mockRpc        = vi.hoisted(() => vi.fn());
const mockAdminFrom  = vi.hoisted(() => vi.fn());
const mockFromClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn(), billing: vi.fn(), auth: vi.fn() },
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFromClient,
  })),
}));

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: vi.fn(() => ({ rpc: mockRpc, from: mockAdminFrom })),
}));

import { GET, PATCH } from '@/app/api/tokens/route';

function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}
const NO_SESSION = { data: { session: null } };

function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/tokens', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function setupClientFrom(balanceData: { balance: number } | null) {
  const mockSingle = vi.fn().mockResolvedValue({ data: balanceData });
  const mockUpsert = vi.fn().mockResolvedValue({ data: null });
  mockFromClient.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    upsert: mockUpsert,
  });
  return { mockSingle, mockUpsert };
}

describe('GET /api/tokens — extended edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default balance (50000) when no session', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(50000);
  });

  it('returns stored balance for authenticated user', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-tok-1'));
    setupClientFrom({ balance: 42000 });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(42000);
  });

  it('first-time user gets default balance via upsert', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-new'));
    const { mockUpsert } = setupClientFrom(null);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(50000);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'uid-new', balance: 50000 }),
      expect.objectContaining({ onConflict: 'user_id' }),
    );
  });

  it('returns balance of 0 for depleted user', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-depleted'));
    setupClientFrom({ balance: 0 });
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(0);
  });
});

describe('PATCH /api/tokens — extended edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unauthenticated returns 401', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await PATCH(makeReq('PATCH', { delta: -100 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('deducts tokens via RPC and returns new balance', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-deduct'));
    mockRpc.mockResolvedValue({ data: 49500, error: null });
    const res = await PATCH(makeReq('PATCH', { delta: -500 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(49500);
    expect(mockRpc).toHaveBeenCalledWith('deduct_tokens', { p_user_id: 'uid-deduct', p_delta: -500 });
  });

  it('invalid positive delta returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-pos'));
    const res = await PATCH(makeReq('PATCH', { delta: 500 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/negative integer/i);
  });

  it('delta of 0 returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-zero'));
    const res = await PATCH(makeReq('PATCH', { delta: 0 }));
    expect(res.status).toBe(400);
  });

  it('non-integer delta returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-float'));
    const res = await PATCH(makeReq('PATCH', { delta: -2.5 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/negative integer/i);
  });

  it('delta below -10000 returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-huge'));
    const res = await PATCH(makeReq('PATCH', { delta: -50000 }));
    expect(res.status).toBe(400);
  });

  it('delta of exactly -10000 succeeds', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-max'));
    mockRpc.mockResolvedValue({ data: 40000, error: null });
    const res = await PATCH(makeReq('PATCH', { delta: -10000 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(40000);
  });

  it('delta of exactly -1 succeeds (minimum valid deduction)', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-min'));
    mockRpc.mockResolvedValue({ data: 49999, error: null });
    const res = await PATCH(makeReq('PATCH', { delta: -1 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(49999);
  });

  it('missing delta field returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-missing'));
    const res = await PATCH(makeReq('PATCH', {}));
    expect(res.status).toBe(400);
  });

  it('string delta returns 400', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-str'));
    const res = await PATCH(makeReq('PATCH', { delta: '-100' }));
    expect(res.status).toBe(400);
  });

  it('optimistic lock exhaustion returns 409', async () => {
    mockGetSession.mockResolvedValue(sessionOf('uid-conflict'));
    mockRpc.mockResolvedValue({ data: null, error: new Error('no rpc function') });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { balance: 50000 } });
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: null });
    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle, eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: mockUpdateMaybeSingle })) })) })) })),
    }));

    const res = await PATCH(makeReq('PATCH', { delta: -100 }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
