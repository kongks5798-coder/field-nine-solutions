import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/core/adminAuth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));

import { POST } from '@/app/api/admin/analyze/route';

const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validData = {
  sales:  [{ t: '2024-01', v: 100 }, { t: '2024-02', v: 200 }],
  trends: [{ t: '2024-01', v: 5 },  { t: '2024-02', v: 10 }],
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
});

describe('POST /api/admin/analyze', () => {
  it('유효한 데이터 → 200 + result', async () => {
    const res = await POST(makeReq(validData));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result).toBeDefined();
  });

  it('sales 누락 → 400', async () => {
    const res = await POST(makeReq({ trends: validData.trends }));
    expect(res.status).toBe(400);
  });

  it('trends 누락 → 400', async () => {
    const res = await POST(makeReq({ sales: validData.sales }));
    expect(res.status).toBe(400);
  });

  it('sales 빈 배열 → 400 (min 1)', async () => {
    const res = await POST(makeReq({ sales: [], trends: validData.trends }));
    expect(res.status).toBe(400);
  });

  it('데이터포인트 v가 문자열 → 400', async () => {
    const res = await POST(makeReq({
      sales: [{ t: '2024-01', v: 'not-a-number' }],
      trends: validData.trends,
    }));
    expect(res.status).toBe(400);
  });

  it('sales 1001개 초과 → 400 (max 1000)', async () => {
    const bigArray = Array.from({ length: 1001 }, (_, i) => ({ t: `m${i}`, v: i }));
    const res = await POST(makeReq({ sales: bigArray, trends: validData.trends }));
    expect(res.status).toBe(400);
  });

  it('인증 실패 → 401', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const res = await POST(makeReq(validData));
    expect(res.status).toBe(401);
  });
});
