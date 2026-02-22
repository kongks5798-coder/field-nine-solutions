import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  ipFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
  checkLimit: vi.fn(),
  headersFor: vi.fn().mockReturnValue({}),
  autoProcessPaidOrders: vi.fn(),
}));

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: mocks.ipFromHeaders,
  checkLimit: mocks.checkLimit,
  headersFor: mocks.headersFor,
}));

vi.mock('@/core/orders', () => ({
  autoProcessPaidOrders: mocks.autoProcessPaidOrders,
}));

import { POST } from '@/app/api/ai/orders/process/route';

function makeReq() {
  return new Request('http://localhost/api/ai/orders/process', { method: 'POST' });
}

describe('POST /api/ai/orders/process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkLimit.mockReturnValue({ ok: true, remaining: 5, reset: 0 });
    mocks.autoProcessPaidOrders.mockResolvedValue({ processed: 3 });
  });

  it('rate limit 초과 → 429 반환', async () => {
    mocks.checkLimit.mockReturnValue({ ok: false, remaining: 0, reset: 60 });
    mocks.headersFor.mockReturnValue({ 'X-RateLimit-Remaining': '0' });
    const res = await POST(makeReq());
    expect(res.status).toBe(429);
  });

  it('성공 시 { ok: true, processed: N } 반환', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(3);
  });

  it('autoProcessPaidOrders 호출됨', async () => {
    await POST(makeReq());
    expect(mocks.autoProcessPaidOrders).toHaveBeenCalledOnce();
  });

  it('processed = 0인 경우도 정상 반환', async () => {
    mocks.autoProcessPaidOrders.mockResolvedValue({ processed: 0 });
    const res = await POST(makeReq());
    const body = await res.json();
    expect(body.processed).toBe(0);
    expect(body.ok).toBe(true);
  });
});
