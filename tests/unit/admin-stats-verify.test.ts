import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  db: {
    stats:         vi.fn(),
    listCustomers: vi.fn(),
  },
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));
vi.mock('@/core/database', () => ({ getDB: () => mocks.db }));

import { GET as STATS_GET }  from '@/app/api/admin/stats/route';
import { GET as VERIFY_GET } from '@/app/api/admin/verify/route';

const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(path: string) {
  return new Request(`http://localhost${path}`);
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  mocks.db.stats.mockResolvedValue({ totalOrders: 10, totalAmount: 500000, cancelled: 1, refunded: 0 });
  mocks.db.listCustomers.mockResolvedValue([
    { id: 'c1', name: '홍길동', email: 'hong@test.com' },
    { id: 'c2', name: '김민준', email: 'kim@test.com' },
  ]);
});

// ── GET /api/admin/stats ───────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {
  it('인증 성공 → 200 + stats 객체', async () => {
    const res = await STATS_GET(makeReq('/api/admin/stats'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.stats).toBeDefined();
    expect(typeof body.stats.customers).toBe('number');
    expect(typeof body.stats.orders).toBe('number');
    expect(typeof body.stats.revenue).toBe('number');
  });

  it('customers 수는 listCustomers 결과 길이와 일치', async () => {
    const res = await STATS_GET(makeReq('/api/admin/stats'));
    const body = await res.json();
    expect(body.stats.customers).toBe(2);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await STATS_GET(makeReq('/api/admin/stats'));
    expect(res.status).toBe(401);
  });

  it('DB stats null 시 stats: null 반환', async () => {
    mocks.db.stats.mockResolvedValueOnce(null);
    const res = await STATS_GET(makeReq('/api/admin/stats'));
    expect(res.status).toBe(200);
    expect((await res.json()).stats).toBeNull();
  });
});

// ── GET /api/admin/verify ──────────────────────────────────────────────────
describe('GET /api/admin/verify', () => {
  it('유효한 auth 쿠키 → 200 + { ok: true }', async () => {
    const res = await VERIFY_GET(makeReq('/api/admin/verify'));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('auth 쿠키 없음 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await VERIFY_GET(makeReq('/api/admin/verify'));
    expect(res.status).toBe(401);
  });
});
