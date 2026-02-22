import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock Supabase ──
const mockGetSession = vi.hoisted(() => vi.fn());
const mockPromiseAll = vi.hoisted(() => ({
  sub: vi.fn().mockResolvedValue({ data: { plan: 'starter', status: 'active' } }),
  records: vi.fn().mockResolvedValue({ data: [] }),
  monthUsage: vi.fn().mockResolvedValue({ data: { ai_calls: 5, amount_krw: 450, status: 'open' } }),
  cap: vi.fn().mockResolvedValue({ data: { monthly_limit: 50000, warn_threshold: 40000, hard_limit: 50000 } }),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: mockPromiseAll.sub,
      insert: mockPromiseAll.insert,
    })),
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { billing: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET, POST } from '@/app/api/billing/usage/route';

const SESSION = { data: { session: { user: { id: 'uid-1' } } } };
const NO_SESSION = { data: { session: null } };

function makeReq(method: 'GET' | 'POST', body?: unknown) {
  return new NextRequest('http://localhost/api/billing/usage', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe('GET /api/billing/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
  });

  it('비인증 → 401 반환', async () => {
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
  });

  it('인증 시 plan과 usage 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('plan');
    expect(body).toHaveProperty('usage');
    expect(body).toHaveProperty('metered');
  });
});

describe('POST /api/billing/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    mockPromiseAll.insert.mockResolvedValue({ data: null, error: null });
  });

  it('비인증 → 401 반환', async () => {
    const res = await POST(makeReq('POST', { type: 'ai_call' }));
    expect(res.status).toBe(401);
  });

  it('잘못된 type → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { type: 'invalid_type' }));
    expect(res.status).toBe(400);
  });

  it('quantity 음수 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq('POST', { type: 'ai_call', quantity: -1 }));
    expect(res.status).toBe(400);
  });

  it('정상 요청 → recorded:true 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    mockPromiseAll.sub.mockResolvedValue({ data: { plan: 'pro' } });
    const res = await POST(makeReq('POST', { type: 'ai_call', quantity: 1 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recorded).toBe(true);
  });
});
