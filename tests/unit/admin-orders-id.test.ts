// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  db: {
    getOrderById: vi.fn(),
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
vi.mock('@/core/orders', () => ({
  canTransition: vi.fn(() => true),
  isOrderStatus: vi.fn((s) => ['pending','paid','cancelled','refunded','preparing'].includes(s)),
}));
vi.mock('@/core/integrations/slack', () => ({ slackNotify: vi.fn() }));
vi.mock('@/core/integrations/zapier', () => ({ zapierNotify: vi.fn() }));

import { DELETE, PATCH } from '@/app/api/admin/orders/[id]/route';
import { canTransition } from '@/core/orders';

function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/orders/ord1', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function ctx(id = 'ord1') {
  return { params: Promise.resolve({ id }) };
}

const AUTH_OK = { ok: true };
const AUTH_FAIL = {
  ok: false,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

const SAMPLE_ORDER = { id: 'ord1', status: 'pending', customerId: 'cust1', amount: 100000 };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  mocks.db.getOrderById.mockResolvedValue(SAMPLE_ORDER);
  mocks.db.updateOrderStatus.mockResolvedValue({ ...SAMPLE_ORDER, status: 'paid' });
  vi.mocked(canTransition).mockReturnValue(true);
});

describe('DELETE /api/admin/orders/[id]', () => {
  it('returns 200 with order id when found', async () => {
    const res = await DELETE(makeReq('DELETE'), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe('ord1');
  });

  it('returns 401 when admin auth fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await DELETE(makeReq('DELETE'), ctx());
    expect(res.status).toBe(401);
  });

  it('returns 404 when order not found', async () => {
    mocks.db.getOrderById.mockResolvedValueOnce(null);
    const res = await DELETE(makeReq('DELETE'), ctx('nonexistent'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/orders/[id]', () => {
  it('returns 200 with updated order on valid transition', async () => {
    const res = await PATCH(makeReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order).toBeDefined();
  });

  it('returns 401 when admin auth fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await PATCH(makeReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid status value', async () => {
    const res = await PATCH(makeReq('PATCH', { status: 'INVALID_STATUS' }), ctx());
    expect(res.status).toBe(400);
  });

  it('returns 404 when order not found', async () => {
    mocks.db.getOrderById.mockResolvedValueOnce(null);
    const res = await PATCH(makeReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(404);
  });

  it('returns 400 when transition is not allowed', async () => {
    vi.mocked(canTransition).mockReturnValueOnce(false);
    const res = await PATCH(makeReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid transition');
  });

  it('returns 500 when db update fails', async () => {
    mocks.db.updateOrderStatus.mockResolvedValueOnce(null);
    const res = await PATCH(makeReq('PATCH', { status: 'paid' }), ctx());
    expect(res.status).toBe(500);
  });

  it('returns 400 when body is missing', async () => {
    const req = new NextRequest('http://localhost/api/admin/orders/ord1', { method: 'PATCH' });
    const res = await PATCH(req, ctx());
    expect(res.status).toBe(400);
  });
});
