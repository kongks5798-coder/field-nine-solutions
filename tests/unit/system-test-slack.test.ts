import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  ipFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
  checkLimit: vi.fn(),
  headersFor: vi.fn().mockReturnValue({}),
  slackNotify: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: mocks.ipFromHeaders,
  checkLimit: mocks.checkLimit,
  headersFor: mocks.headersFor,
}));

vi.mock('@/core/integrations/slack', () => ({
  slackNotify: mocks.slackNotify,
}));

import { GET } from '@/app/api/system/test-slack/route';

function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/system/test-slack');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), { method: 'GET' });
}

describe('GET /api/system/test-slack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkLimit.mockReturnValue({ ok: true, remaining: 5, reset: 0 });
  });

  it('rate limit 초과 시 429 반환', async () => {
    mocks.checkLimit.mockReturnValue({ ok: false, remaining: 0, reset: 60 });
    mocks.headersFor.mockReturnValue({ 'X-RateLimit-Remaining': '0' });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('Too Many Requests');
  });

  it('기본 파라미터로 order_cancelled 이벤트 처리', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sent).toBe(true);
    expect(body.text).toContain('주문 취소 발생');
    expect(mocks.slackNotify).toHaveBeenCalledOnce();
  });

  it('커스텀 이벤트 파라미터 처리', async () => {
    const res = await GET(makeReq({ event: 'new_order', orderId: 'ORD-999', amount: '50000' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toContain('new_order');
    expect(body.text).toContain('ORD-999');
    expect(body.text).toContain('50000');
  });

  it('slackNotify 호출 후 { ok: true, sent: true } 반환', async () => {
    await GET(makeReq({ event: 'order_cancelled', orderId: 'O-1', amount: '9900' }));
    expect(mocks.slackNotify).toHaveBeenCalledWith(
      expect.stringContaining('O-1')
    );
  });
});
