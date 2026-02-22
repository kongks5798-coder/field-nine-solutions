import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));

import { GET, POST }     from '@/app/api/ai/orders/route';
import { GET as GET_ONE, PATCH } from '@/app/api/ai/orders/[id]/route';
import { POST as GENERATE } from '@/app/api/ai/orders/generate/route';

// ── Helpers ────────────────────────────────────────────────────────────────
function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/ai/orders', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function makeIdReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/ai/orders/ord1', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function makeGenReq(body?: unknown) {
  return new NextRequest('http://localhost/api/ai/orders/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}
function ctx(id = 'ord1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/ai/orders ─────────────────────────────────────────────────────
describe('GET /api/ai/orders', () => {
  it('200 + orders 배열 반환', async () => {
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.orders)).toBe(true);
  });
});

// ── POST /api/ai/orders ────────────────────────────────────────────────────
describe('POST /api/ai/orders', () => {
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
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: -1 }));
    expect(res.status).toBe(400);
  });

  it('amount 0 → 400 (positive 필요)', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('유효하지 않은 status → 400', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 100, status: 'unknown_xyz' }));
    expect(res.status).toBe(400);
  });

  it('유효한 status (pending) → 200', async () => {
    const res = await POST(makeReq('POST', { customerId: 'cust1', amount: 100, status: 'pending' }));
    expect(res.status).toBe(200);
  });
});

// ── GET /api/ai/orders/[id] ────────────────────────────────────────────────
describe('GET /api/ai/orders/[id]', () => {
  it('주문 조회 → 200 + order', async () => {
    const res = await GET_ONE(makeIdReq('GET'), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order).toBeDefined();
    expect(body.order.id).toBe('ord1');
  });
});

// ── PATCH /api/ai/orders/[id] ─────────────────────────────────────────────
describe('PATCH /api/ai/orders/[id]', () => {
  it('command 전달 → 200 + updated order', async () => {
    const res = await PATCH(makeIdReq('PATCH', { command: 'confirm' }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order).toBeDefined();
  });

  it('status 직접 전달 → 200 + updated order', async () => {
    const res = await PATCH(makeIdReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('command도 status도 없음 → 400 (refine 실패)', async () => {
    const res = await PATCH(makeIdReq('PATCH', {}), ctx());
    expect(res.status).toBe(400);
  });

  it('유효하지 않은 status → 400', async () => {
    const res = await PATCH(makeIdReq('PATCH', { status: 'invalid_xyz' }), ctx());
    expect(res.status).toBe(400);
  });
});

// ── POST /api/ai/orders/generate ──────────────────────────────────────────
describe('POST /api/ai/orders/generate', () => {
  it('기본값 → 200 + created:10, processed>0', async () => {
    const res = await GENERATE(makeGenReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.created).toBe(10);
    expect(body.processed).toBeGreaterThan(0);
  });

  it('count=5 → 200 + created:5', async () => {
    const res = await GENERATE(makeGenReq({ count: 5 }));
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(5);
  });

  it('autoProcess=false → 200 + processed:0', async () => {
    const res = await GENERATE(makeGenReq({ autoProcess: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(0);
  });

  it('avgAmount=500 → 200', async () => {
    const res = await GENERATE(makeGenReq({ count: 3, avgAmount: 500 }));
    expect(res.status).toBe(200);
    expect((await res.json()).created).toBe(3);
  });
});
