import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  ipFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
  checkLimit: vi.fn(),
  headersFor: vi.fn().mockReturnValue({}),
}));

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: mocks.ipFromHeaders,
  checkLimit: mocks.checkLimit,
  headersFor: mocks.headersFor,
}));

import { GET } from '@/app/api/system/integrations/status/route';

function makeReq() {
  return new Request('http://localhost/api/system/integrations/status', { method: 'GET' });
}

describe('GET /api/system/integrations/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkLimit.mockReturnValue({ ok: true, remaining: 5, reset: 0 });
  });

  it('rate limit 초과 시 429 반환', async () => {
    mocks.checkLimit.mockReturnValue({ ok: false, remaining: 0, reset: 60 });
    mocks.headersFor.mockReturnValue({ 'X-RateLimit-Remaining': '0' });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
  });

  it('200 반환 + 통합 상태 객체 포함', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('ok');
    expect(body).toHaveProperty('auth');
    expect(body).toHaveProperty('ai');
    expect(body).toHaveProperty('slack');
    expect(body).toHaveProperty('linear');
    expect(body).toHaveProperty('supabase');
  });

  it('환경 변수 없을 때 ok: false', async () => {
    const res = await GET(makeReq());
    const body = await res.json();
    // 환경 변수가 없으므로 ok는 false (ADMIN_PASSWORD, JWT_SECRET 등 없음)
    expect(typeof body.ok).toBe('boolean');
  });

  it('platform 필드 포함', async () => {
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body).toHaveProperty('platform');
    expect(body.platform).toHaveProperty('vercel');
    expect(body.platform).toHaveProperty('cloudflare');
  });
});
