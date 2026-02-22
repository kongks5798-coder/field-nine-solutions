import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  db: {
    listOrders:        vi.fn(),
    createOrder:       vi.fn(),
    getOrderById:      vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));
vi.mock('@/core/database', () => ({ getDB: () => mocks.db }));

import { GET, POST }     from '@/app/api/admin/orders/route';
import { DELETE, PATCH } from '@/app/api/admin/orders/[id]/route';
import { POST as SIMULATE } from '@/app/api/admin/orders/simulate/route';

const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

const SAMPLE_ORDER = { id: 'ord1', status: 'pending', customerId: 'cust1', amount: 100000 };
const SAMPLE_PAID  = { id: 'ord2', status: 'paid',    customerId: 'cust1', amount: 200000 };

function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/orders', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function makeIdReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/orders/ord1', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function makeSimReq(body?: unknown) {
  return new NextRequest('http://localhost/api/admin/orders/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}
function ctx(id = 'ord1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  mocks.db.listOrders.mockResolvedValue([SAMPLE_ORDER, SAMPLE_PAID]);
  mocks.db.createOrder.mockResolvedValue({ id: 'o_new', status: 'pending', customerId: 'cust1', amount: 50000 });
  mocks.db.getOrderById.mockResolvedValue(SAMPLE_ORDER);
  mocks.db.updateOrderStatus.mockResolvedValue({ ...SAMPLE_ORDER, status: 'paid' });
});

// ── GET /api/admin/orders ──────────────────────────────────────────────────
describe('GET /api/admin/orders', () => {
  it('인증 성공 → 200 + orders 배열', async () => {
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.orders).toHaveLength(2);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/orders ─────────────────────────────────────────────────
describe('POST /api/admin/orders', () => {
  it('유효한 주문 생성 → 200 + order', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 50000 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order).toBeDefined();
  });

  it('customerId 누락 → 400', async () => {
    const res = await POST(makeReq('POST', { amount: 50000 }));
    expect(res.status).toBe(400);
  });

  it('amount 음수 → 400', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: -100 }));
    expect(res.status).toBe(400);
  });

  it('amount 0 → 400 (positive 필요)', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('유효하지 않은 status → 400', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 50000, status: 'invalid_status' }));
    expect(res.status).toBe(400);
  });

  it('유효한 status (paid) → 200', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 50000, status: 'paid' }));
    expect(res.status).toBe(200);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 50000 }));
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/orders/[id] ─────────────────────────────────────────
describe('DELETE /api/admin/orders/[id]', () => {
  it('존재하는 주문 삭제 → 200', async () => {
    const res = await DELETE(makeIdReq('DELETE'), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('주문 없음 → 404', async () => {
    mocks.db.getOrderById.mockResolvedValueOnce(null);
    const res = await DELETE(makeIdReq('DELETE'), ctx('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await DELETE(makeIdReq('DELETE'), ctx());
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/orders/[id] ──────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]', () => {
  it('유효한 status 변경 → 200 + updated order', async () => {
    const res = await PATCH(makeIdReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order).toBeDefined();
  });

  it('유효하지 않은 status 문자열 → 400', async () => {
    const res = await PATCH(makeIdReq('PATCH', { status: 'invalid_status_xyz' }), ctx());
    expect(res.status).toBe(400);
  });

  it('status 누락 → 400', async () => {
    const res = await PATCH(makeIdReq('PATCH', {}), ctx());
    expect(res.status).toBe(400);
  });

  it('주문 없음 → 404', async () => {
    mocks.db.getOrderById.mockResolvedValueOnce(null);
    const res = await PATCH(makeIdReq('PATCH', { status: 'paid' }), ctx('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('updateOrderStatus 실패 → 500', async () => {
    mocks.db.updateOrderStatus.mockResolvedValueOnce(null);
    const res = await PATCH(makeIdReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(500);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await PATCH(makeIdReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/orders/simulate ───────────────────────────────────────
describe('POST /api/admin/orders/simulate', () => {
  it('기본값 (count 없음) → 200 + 10개 결과', async () => {
    const res = await SIMULATE(makeSimReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.result)).toBe(true);
    expect(body.result).toHaveLength(10);
  });

  it('count=5 → 200 + 5개 결과', async () => {
    const res = await SIMULATE(makeSimReq({ count: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toHaveLength(5);
  });

  it('count=50 (최대) → 200 + 50개 결과', async () => {
    const res = await SIMULATE(makeSimReq({ count: 50 }));
    expect(res.status).toBe(200);
    expect((await res.json()).result).toHaveLength(50);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await SIMULATE(makeSimReq());
    expect(res.status).toBe(401);
  });
});
