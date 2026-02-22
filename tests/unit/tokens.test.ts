import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));

vi.mock('@/lib/logger', () => ({ log: { debug:vi.fn(),info:vi.fn(),warn:vi.fn(),error:vi.fn(),api:vi.fn(),security:vi.fn(),billing:vi.fn(),auth:vi.fn() } }));

const mockGetSession = vi.fn();
vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn(() => ({ auth: { getSession: mockGetSession } })) }));

const mockRpc = vi.fn();
const mockAdminFrom = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({ getAdminClient: vi.fn(() => ({ rpc: mockRpc, from: mockAdminFrom })) }));

import { PATCH } from '@/app/api/tokens/route';

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/tokens', { method:'PATCH', body:JSON.stringify(body), headers:{'content-type':'application/json'} });
}

function sessionOf(uid: string) { return { data: { session: { user: { id: uid } } } }; }
const NO_SESSION = { data: { session: null } };

describe('PATCH /api/tokens', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await PATCH(makeReq({ delta: -100 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns 400 when delta is positive', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    const res = await PATCH(makeReq({ delta: 100 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/negative integer/i);
  });

  it('returns 400 when delta is not an integer', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    const res = await PATCH(makeReq({ delta: -3.5 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/negative integer/i);
  });

  it('returns balance when RPC succeeds', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    mockRpc.mockResolvedValue({ data: 49900, error: null });
    const res = await PATCH(makeReq({ delta: -100 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(49900);
  });

  it('falls back to optimistic locking when RPC fails', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    mockRpc.mockResolvedValue({ data: null, error: new Error("function not found") });
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { balance: 50000 } });
    const mockEqBalance = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEqUser = vi.fn(() => ({ maybeSingle: mockMaybeSingle, eq: mockEqBalance }));
    const mockSelect = vi.fn(() => ({ eq: mockEqUser }));
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: { balance: 49900 } });
    const mockUpdateSelect = vi.fn(() => ({ maybeSingle: mockUpdateMaybeSingle }));
    const mockUpdateEqBalance = vi.fn(() => ({ select: mockUpdateSelect }));
    const mockUpdateEqUser = vi.fn(() => ({ eq: mockUpdateEqBalance }));
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEqUser }));
    mockAdminFrom.mockImplementation(() => ({ select: mockSelect, update: mockUpdate }));
    const res = await PATCH(makeReq({ delta: -100 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balance).toBe(49900);
  });

  it('delta < -10000이면 400 반환 (Zod 검증)', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-123"));
    const res = await PATCH(makeReq({ delta: -99999 }));
    expect(res.status).toBe(400);
  });

  it('returns 409 after 5 failed optimistic lock attempts', async () => {
    mockGetSession.mockResolvedValue(sessionOf("user-456"));
    mockRpc.mockResolvedValue({ data: null, error: new Error("no rpc") });
    const mockMaybeSingleSelect = vi.fn().mockResolvedValue({ data: { balance: 50000 } });
    const mockEqBalance = vi.fn(() => ({ maybeSingle: mockMaybeSingleSelect }));
    const mockEqUser = vi.fn(() => ({ maybeSingle: mockMaybeSingleSelect, eq: mockEqBalance }));
    const mockSelect = vi.fn(() => ({ eq: mockEqUser }));
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: null });
    const mockUpdateSelect = vi.fn(() => ({ maybeSingle: mockUpdateMaybeSingle }));
    const mockUpdateEqBalance = vi.fn(() => ({ select: mockUpdateSelect }));
    const mockUpdateEqUser = vi.fn(() => ({ eq: mockUpdateEqBalance }));
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEqUser }));
    mockAdminFrom.mockImplementation(() => ({ select: mockSelect, update: mockUpdate }));
    const res = await PATCH(makeReq({ delta: -100 }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});