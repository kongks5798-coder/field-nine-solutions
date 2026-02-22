import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  db: {
    createCustomer: vi.fn(),
    createOrder:    vi.fn(),
  },
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));
vi.mock('@/core/database', () => ({ getDB: () => mocks.db }));

import { POST } from '@/app/api/admin/migrate/route';

const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  mocks.db.createCustomer.mockResolvedValue({ id: 'c_new' });
  mocks.db.createOrder.mockResolvedValue({ id: 'o_new' });
});

describe('POST /api/admin/migrate', () => {
  it('customers 배열 가져오기 → 200 + inserted.customers 카운트', async () => {
    const res = await POST(makeReq({
      customers: [
        { name: '홍길동', email: 'hong@test.com' },
        { name: '김민준', email: 'kim@test.com' },
      ],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.inserted.customers).toBe(2);
    expect(body.inserted.orders).toBe(0);
    expect(mocks.db.createCustomer).toHaveBeenCalledTimes(2);
  });

  it('orders 배열 가져오기 → 200 + inserted.orders 카운트', async () => {
    const res = await POST(makeReq({
      orders: [
        { customerId: 'cust1', amount: 50000, status: 'paid' },
        { customerId: 'cust2', amount: 30000 },
      ],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.inserted.orders).toBe(2);
    expect(body.inserted.customers).toBe(0);
  });

  it('customers + orders 동시 → 200 + 둘 다 삽입', async () => {
    const res = await POST(makeReq({
      customers: [{ name: '홍길동', email: 'hong@test.com' }],
      orders:    [{ customerId: 'cust1', amount: 100000 }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inserted.customers).toBe(1);
    expect(body.inserted.orders).toBe(1);
  });

  it('빈 body (customers/orders 둘 다 없음) → 400', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('이메일 형식 오류인 고객 → 400 (Zod)', async () => {
    const res = await POST(makeReq({
      customers: [{ name: '홍길동', email: 'not-an-email' }],
    }));
    expect(res.status).toBe(400);
  });

  it('amount 음수인 주문 → 400 (Zod)', async () => {
    const res = await POST(makeReq({
      orders: [{ customerId: 'cust1', amount: -100 }],
    }));
    expect(res.status).toBe(400);
  });

  it('유효하지 않은 주문 status → 400 (Zod refine)', async () => {
    const res = await POST(makeReq({
      orders: [{ customerId: 'cust1', amount: 50000, status: 'invalid_xyz' }],
    }));
    expect(res.status).toBe(400);
  });

  it('name이 빈 문자열인 고객 → 400 (Zod min 1)', async () => {
    const res = await POST(makeReq({
      customers: [{ name: '', email: 'hong@test.com' }],
    }));
    expect(res.status).toBe(400);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await POST(makeReq({ customers: [{ name: '홍길동', email: 'hong@test.com' }] }));
    expect(res.status).toBe(401);
  });

  it('유효한 status (paid) → 200', async () => {
    const res = await POST(makeReq({
      orders: [{ customerId: 'cust1', amount: 50000, status: 'paid' }],
    }));
    expect(res.status).toBe(200);
  });
});
