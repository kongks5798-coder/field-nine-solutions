import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock sendContactEmail ──
vi.mock('@/lib/email', () => ({ sendContactEmail: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from '@/app/api/contact/route';
import { sendContactEmail } from '@/lib/email';

const mockSendEmail = sendContactEmail as ReturnType<typeof vi.fn>;

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('이름 없으면 400 반환', async () => {
    const res = await POST(makeReq({ email: 'test@example.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/올바르지/);
  });

  it('이메일 없으면 400 반환', async () => {
    const res = await POST(makeReq({ name: '홍길동' }));
    expect(res.status).toBe(400);
  });

  it('유효하지 않은 이메일이면 400 반환', async () => {
    const res = await POST(makeReq({ name: '홍길동', email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('RESEND_API_KEY 없으면 이메일 전송 스킵하고 200 반환', async () => {
    const res = await POST(makeReq({ name: '홍길동', email: 'test@example.com', message: '문의합니다' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('RESEND_API_KEY 있으면 이메일 전송 시도', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSendEmail.mockResolvedValue(undefined);
    const res = await POST(makeReq({ name: '홍길동', email: 'test@example.com' }));
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });
});
