// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  canTransition: vi.fn(),
  resolveOrderCommand: vi.fn(),
  updateOrderStatus: vi.fn(),
  isOrderStatus: vi.fn(),
}));

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));
vi.mock('@/core/orders', () => ({
  getOrder: mocks.getOrder,
  canTransition: mocks.canTransition,
  resolveOrderCommand: mocks.resolveOrderCommand,
  updateOrderStatus: mocks.updateOrderStatus,
  isOrderStatus: mocks.isOrderStatus,
}));

import { GET, PATCH } from '@/app/api/ai/orders/[id]/route';

function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/ai/orders/ord1', {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function ctx(id = 'ord1') {
  return { params: Promise.resolve({ id }) };
}

const SAMPLE_ORDER = { id: 'ord1', status: 'PENDING', customerId: 'dummy', amount: 0 };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOrder.mockReturnValue(SAMPLE_ORDER);
  mocks.canTransition.mockReturnValue(true);
  mocks.resolveOrderCommand.mockReturnValue('OPEN');
  mocks.updateOrderStatus.mockResolvedValue({ ...SAMPLE_ORDER, status: 'OPEN' });
  mocks.isOrderStatus.mockImplementation((s) =>
    ['pending','open','cancelled','refunded','paid','PENDING','OPEN','CANCELLED'].includes(s)
  );
});

describe('GET /api/ai/orders/[id]', () => {
  it('returns 200 with order when found', async () => {
    const res = await GET(makeReq('GET'), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order.id).toBe('ord1');
  });

  it('returns 404 when order not found', async () => {
    mocks.getOrder.mockReturnValueOnce(null);
    const res = await GET(makeReq('GET'), ctx('nonexistent'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/ai/orders/[id]', () => {
  it('returns 200 with updated order via status', async () => {
    const res = await PATCH(makeReq('PATCH', { status: 'OPEN' }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order).toBeDefined();
  });

  it('returns 200 with updated order via command', async () => {
    const res = await PATCH(makeReq('PATCH', { command: 'approve' }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mocks.resolveOrderCommand).toHaveBeenCalledWith('approve', 'PENDING');
  });

  it('returns 400 when neither command nor status provided', async () => {
    const res = await PATCH(makeReq('PATCH', {}), ctx());
    expect(res.status).toBe(400);
  });

  it('returns 404 when order not found', async () => {
    mocks.getOrder.mockReturnValueOnce(null);
    const res = await PATCH(makeReq('PATCH', { status: 'OPEN' }), ctx());
    expect(res.status).toBe(404);
  });

  it('returns 400 when transition is not allowed', async () => {
    mocks.canTransition.mockReturnValueOnce(false);
    const res = await PATCH(makeReq('PATCH', { status: 'OPEN' }), ctx());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid transition');
  });

  it('returns 500 when update fails', async () => {
    mocks.updateOrderStatus.mockResolvedValueOnce(null);
    const res = await PATCH(makeReq('PATCH', { status: 'OPEN' }), ctx());
    expect(res.status).toBe(500);
  });

  it('returns 400 when body is missing', async () => {
    const req = new NextRequest('http://localhost/api/ai/orders/ord1', { method: 'PATCH' });
    const res = await PATCH(req, ctx());
    expect(res.status).toBe(400);
  });
});
