import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  logError: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: mocks.logError,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { POST } from '@/app/api/error-report/route';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/error-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  type: 'unhandledrejection',
  message: 'TypeError: Cannot read properties of undefined',
  stack: 'TypeError: Cannot read properties of undefined\n    at Object.<anonymous> (/app/page.tsx:42:5)',
  url: '/workspace',
  ua: 'Mozilla/5.0',
  ts: '2025-01-01T00:00:00Z',
};

describe('POST /api/error-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('에러 리포트 저장 성공 — { ok: true } 반환', async () => {
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('에러 리포트 시 logger.error 호출 확인', async () => {
    await POST(makeReq(VALID_BODY));
    expect(mocks.logError).toHaveBeenCalledOnce();
    expect(mocks.logError).toHaveBeenCalledWith(
      'Client error reported',
      expect.objectContaining({
        type: 'unhandledrejection',
        message: 'TypeError: Cannot read properties of undefined',
        url: '/workspace',
      }),
    );
  });

  it('JSON 파싱 실패 시 400 반환', async () => {
    const req = new NextRequest('http://localhost/api/error-report', {
      method: 'POST',
      body: 'this is not json',
      headers: { 'Content-Type': 'text/plain' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('긴 스택트레이스 처리 — 2000자로 절단', async () => {
    const longStack = 'Error: something\n' + 'at line '.repeat(500);
    expect(longStack.length).toBeGreaterThan(2000);

    await POST(makeReq({ ...VALID_BODY, stack: longStack }));

    expect(mocks.logError).toHaveBeenCalledOnce();
    const callArgs = mocks.logError.mock.calls[0][1];
    expect(callArgs.stack.length).toBeLessThanOrEqual(2000);
  });

  it('필수 필드 없이도 저장 성공 (최소 body)', async () => {
    // The route accepts any JSON body; it just logs whatever it gets
    const res = await POST(makeReq({ message: 'simple error' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mocks.logError).toHaveBeenCalledWith(
      'Client error reported',
      expect.objectContaining({
        message: 'simple error',
      }),
    );
  });
});
