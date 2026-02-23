// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  simulateOrderFlow: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));
vi.mock('@/core/orders', () => ({ simulateOrderFlow: mocks.simulateOrderFlow }));

import { POST } from '@/app/api/admin/orders/simulate/route';

function makeReq(body?: unknown) {
  return new NextRequest('http://localhost/api/admin/orders/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const AUTH_OK = { ok: true };
const AUTH_FAIL = {
  ok: false,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
  mocks.simulateOrderFlow.mockReturnValue(
    Array.from({ length: 10 }, (_, i) => ({ id: 'sim'+(i+1), status: 'SIMULATED' }))
  );
});

describe('POST /api/admin/orders/simulate', () => {
  it('returns 200 with simulation result', async () => {
    const res = await POST(makeReq({ count: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result).toBeDefined();
    expect(mocks.simulateOrderFlow).toHaveBeenCalledWith(5);
  });

  it('uses default count of 10 when omitted', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect(mocks.simulateOrderFlow).toHaveBeenCalledWith(10);
  });

  it('uses default count when body is unparseable', async () => {
    const req = new NextRequest('http://localhost/api/admin/orders/simulate', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mocks.simulateOrderFlow).toHaveBeenCalledWith(10);
  });

  it('returns 401 when admin auth fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await POST(makeReq({ count: 5 }));
    expect(res.status).toBe(401);
  });

  it('rejects count exceeding max (50)', async () => {
    await expect(POST(makeReq({ count: 100 }))).rejects.toThrow();
  });

  it('rejects count below min (1)', async () => {
    await expect(POST(makeReq({ count: 0 }))).rejects.toThrow();
  });
});
