import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));

import { POST } from '@/app/api/ai/orders/import/route';

function makeReq(body?: unknown) {
  return new NextRequest('http://localhost/api/ai/orders/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/ai/orders/import', () => {
  it('텍스트 없음 (기본값) → 200 + created/processed', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.created).toBe('number');
    expect(typeof body.processed).toBe('number');
    expect(Array.isArray(body.rejected)).toBe(true);
  });

  it('텍스트 제공 → 200 + created 1개 이상', async () => {
    const res = await POST(makeReq({ text: '고객 홍길동, 금액 50000' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.created).toBeGreaterThan(0);
  });

  it('autoProcess=false → 200 + processed: 0', async () => {
    const res = await POST(makeReq({ text: '주문 데이터', autoProcess: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(0);
  });

  it('autoProcess=true (기본) → 200 + processed > 0', async () => {
    const res = await POST(makeReq({ text: '주문 데이터' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBeGreaterThan(0);
  });

  it('빈 body → 200 (기본값 적용)', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
