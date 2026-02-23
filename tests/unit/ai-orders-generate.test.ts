import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── 레이트 리미터 모킹 ─────────────────────────────────────────────────────
const mockCheckLimit = vi.hoisted(() => vi.fn());
const mockIpFromHeaders = vi.hoisted(() => vi.fn());
const mockHeadersFor = vi.hoisted(() => vi.fn());

vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: mockIpFromHeaders,
  checkLimit: mockCheckLimit,
  headersFor: mockHeadersFor,
}));

// core/orders 모킹
const mockGenerateOrdersFromMarket = vi.hoisted(() => vi.fn());
const mockAutoProcessOrders = vi.hoisted(() => vi.fn());

vi.mock('@/core/orders', () => ({
  generateOrdersFromMarket: mockGenerateOrdersFromMarket,
  autoProcessOrders: mockAutoProcessOrders,
}));

import { POST } from '@/app/api/ai/orders/generate/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
function makeReq(body?: unknown) {
  return new NextRequest('http://localhost/api/ai/orders/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

function makeReqInvalidJson() {
  return new NextRequest('http://localhost/api/ai/orders/generate', {
    method: 'POST',
    body: 'not-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('POST /api/ai/orders/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: 레이트 리미트 통과
    mockIpFromHeaders.mockReturnValue('127.0.0.1');
    mockCheckLimit.mockReturnValue({ ok: true, remaining: 9, limit: 10, resetAt: Math.ceil(Date.now() / 1000) + 60 });
    mockHeadersFor.mockReturnValue({});

    // 기본: orders 모킹
    mockGenerateOrdersFromMarket.mockImplementation((count: number, avgAmount: number) =>
      Array.from({ length: count }, (_, i) => ({ id: `gen${i + 1}`, amount: avgAmount, status: 'GENERATED' })),
    );
    mockAutoProcessOrders.mockImplementation(async (orders: Record<string, unknown>[]) => ({
      processed: orders.length,
      updated: orders.map(o => ({ ...o, status: 'PROCESSED' })),
    }));
  });

  // ── 1. 기본값으로 정상 생성 → 200 ────────────────────────────────────────
  it('기본값 (빈 body) → 200 + created:10, processed:10', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.created).toBe(10);
    expect(body.processed).toBe(10);

    // generateOrdersFromMarket이 기본값으로 호출되었는지 확인
    expect(mockGenerateOrdersFromMarket).toHaveBeenCalledWith(10, 180);
  });

  // ── 2. count 지정 → 200 ──────────────────────────────────────────────────
  it('count=5 → 200 + created:5', async () => {
    const res = await POST(makeReq({ count: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(5);
    expect(mockGenerateOrdersFromMarket).toHaveBeenCalledWith(5, 180);
  });

  // ── 3. autoProcess=false → processed:0 ───────────────────────────────────
  it('autoProcess=false → 200 + processed:0', async () => {
    const res = await POST(makeReq({ autoProcess: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(0);
    // autoProcessOrders가 호출되지 않아야 함
    expect(mockAutoProcessOrders).not.toHaveBeenCalled();
  });

  // ── 4. avgAmount 지정 → 200 ──────────────────────────────────────────────
  it('avgAmount=500 → 200 + 정상 생성', async () => {
    const res = await POST(makeReq({ count: 3, avgAmount: 500 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(3);
    expect(mockGenerateOrdersFromMarket).toHaveBeenCalledWith(3, 500);
  });

  // ── 5. 레이트 리미트 초과 → 429 ──────────────────────────────────────────
  it('레이트 리미트 초과 → 429 반환', async () => {
    const resetAt = Math.ceil(Date.now() / 1000) + 30;
    mockCheckLimit.mockReturnValue({ ok: false, remaining: 0, limit: 10, resetAt });
    mockHeadersFor.mockReturnValue({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(resetAt),
      'Retry-After': '30',
    });

    const res = await POST(makeReq());
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('Too Many Requests');

    // Rate-limit 헤더 확인
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  // ── 6. count 범위 초과 (>50) → Zod parse 예외 ──────────────────────────────
  it('count=100 (최대 50 초과) → ZodError throw', async () => {
    // z.number().int().min(1).max(50) 위반 → GenerateSchema.parse()가 throw
    // 라우트에 try-catch 없으므로 예외 전파
    await expect(POST(makeReq({ count: 100 }))).rejects.toThrow();
  });

  // ── 7. count=0 (최소 1 미만) → Zod parse 예외 ────────────────────────────
  it('count=0 (최소 1 미만) → ZodError throw', async () => {
    await expect(POST(makeReq({ count: 0 }))).rejects.toThrow();
  });

  // ── 8. 잘못된 JSON body → parse 에러 ─────────────────────────────────────
  it('잘못된 JSON body → 기본값 적용 (빈 객체 fallback)', async () => {
    // req.json().catch(() => ({})) → {} → GenerateSchema.parse({}) → 기본값 적용
    const res = await POST(makeReqInvalidJson());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.created).toBe(10); // 기본값 count=10
  });
});
