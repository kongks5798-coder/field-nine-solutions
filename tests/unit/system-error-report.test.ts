import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  ipFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
  checkLimit: vi.fn(),
  headersFor: vi.fn().mockReturnValue({}),
  slackNotify: vi.fn().mockResolvedValue(undefined),
  linearCreateIssue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: mocks.ipFromHeaders,
  checkLimit: mocks.checkLimit,
  headersFor: mocks.headersFor,
}));

vi.mock('@/core/integrations/slack', () => ({
  slackNotify: mocks.slackNotify,
}));

vi.mock('@/core/integrations/linear', () => ({
  linearCreateIssue: mocks.linearCreateIssue,
}));

import { POST } from '@/app/api/system/error-report/route';

function makeReq(body: unknown) {
  return new Request('http://localhost/api/system/error-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = { message: 'TypeError: cannot read property of undefined', url: '/workspace', component: 'AIPanel' };

describe('POST /api/system/error-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkLimit.mockReturnValue({ ok: true, remaining: 5, reset: 0 });
  });

  it('rate limit 초과 시 429 반환', async () => {
    mocks.checkLimit.mockReturnValue({ ok: false, remaining: 0, reset: 60 });
    mocks.headersFor.mockReturnValue({ 'X-RateLimit-Remaining': '0' });
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(429);
  });

  it('message 없는 body → 400 반환', async () => {
    const res = await POST(makeReq({ url: '/workspace' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid payload');
  });

  it('message 빈 문자열 → 400 반환', async () => {
    const res = await POST(makeReq({ message: '' }));
    expect(res.status).toBe(400);
  });

  it('message 500자 초과 → 400 반환', async () => {
    const res = await POST(makeReq({ message: 'x'.repeat(501) }));
    expect(res.status).toBe(400);
  });

  it('유효한 body → 200 + { ok: true } 반환', async () => {
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('유효한 body → slackNotify 호출', async () => {
    await POST(makeReq(VALID_BODY));
    expect(mocks.slackNotify).toHaveBeenCalledOnce();
    expect(mocks.slackNotify).toHaveBeenCalledWith(expect.stringContaining('TypeError'));
  });

  it('stack이 포함된 body → slackNotify에 stack 포함', async () => {
    const body = { ...VALID_BODY, stack: 'Error at line 42' };
    await POST(makeReq(body));
    expect(mocks.slackNotify).toHaveBeenCalledWith(expect.stringContaining('line 42'));
  });

  it('body가 JSON 아닌 경우 → 400 반환', async () => {
    const req = new Request('http://localhost/api/system/error-report', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
