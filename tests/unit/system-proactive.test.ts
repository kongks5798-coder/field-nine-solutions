import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  ipFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
  checkLimit: vi.fn(),
  headersFor: vi.fn().mockReturnValue({}),
  slackNotify: vi.fn().mockResolvedValue(undefined),
  runProactive: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: mocks.ipFromHeaders,
  checkLimit: mocks.checkLimit,
  headersFor: mocks.headersFor,
}));

vi.mock('@/core/integrations/slack', () => ({
  slackNotify: mocks.slackNotify,
}));

vi.mock('@/core/proactive', () => ({
  runProactive: mocks.runProactive,
}));

vi.mock('@/core/adminAuth', () => ({
  requireAdmin: mocks.requireAdmin,
}));

import { GET } from '@/app/api/system/proactive/route';

const MOCK_REPORT = {
  signals: [
    { message: '주문 감소 추세', severity: 'warning' },
    { message: '신규 고객 증가', severity: 'info' },
  ],
  forecast: { nextRevenue: 50000, confidence: 0.85 },
  snapshot: { customers: 120, orders: 45, revenue: 45000 },
};

function makeReq() {
  return new Request('http://localhost/api/system/proactive', { method: 'GET' });
}

describe('GET /api/system/proactive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ ok: true });
    mocks.checkLimit.mockReturnValue({ ok: true, remaining: 5, reset: 0 });
    mocks.runProactive.mockResolvedValue(MOCK_REPORT);
  });

  it('rate limit 초과 시 429 반환', async () => {
    mocks.checkLimit.mockReturnValue({ ok: false, remaining: 0, reset: 60 });
    mocks.headersFor.mockReturnValue({ 'X-RateLimit-Remaining': '0' });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
  });

  it('성공 시 { ok: true, report } 반환', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.report).toBeDefined();
    expect(body.report.forecast.nextRevenue).toBe(50000);
  });

  it('runProactive 호출됨', async () => {
    await GET(makeReq());
    expect(mocks.runProactive).toHaveBeenCalledOnce();
  });

  it('slackNotify 호출되며 리포트 내용 포함', async () => {
    await GET(makeReq());
    expect(mocks.slackNotify).toHaveBeenCalledOnce();
    expect(mocks.slackNotify).toHaveBeenCalledWith(expect.stringContaining('Proactive 리포트'));
  });

  it('signals 상위 3개만 알림에 포함', async () => {
    mocks.runProactive.mockResolvedValue({
      ...MOCK_REPORT,
      signals: [
        { message: '신호1', severity: 'info' },
        { message: '신호2', severity: 'info' },
        { message: '신호3', severity: 'info' },
        { message: '신호4 — 포함되지 않음', severity: 'info' },
      ],
    });
    await GET(makeReq());
    const call = mocks.slackNotify.mock.calls[0][0] as string;
    expect(call).toContain('신호3');
    expect(call).not.toContain('신호4');
  });

  it('예측 매출, 신뢰도, 스냅샷 정보 슬랙 메시지에 포함', async () => {
    await GET(makeReq());
    const call = mocks.slackNotify.mock.calls[0][0] as string;
    expect(call).toContain('85%');
    expect(call).toContain('120'); // customers
    expect(call).toContain('45');  // orders
  });
});
