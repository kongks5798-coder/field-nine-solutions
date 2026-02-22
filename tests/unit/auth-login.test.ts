import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Rate limiter는 항상 통과
vi.mock('@/core/rateLimit', () => ({
  ipFromHeaders: () => '127.0.0.1',
  checkLimit: () => ({ ok: true, remaining: 9, limit: 10, reset: Date.now() + 60000 }),
  headersFor: () => ({}),
}));

import { POST } from '@/app/api/auth/login/route';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_2FA_CODE;
    delete process.env.JWT_SECRET;
  });

  it('ADMIN_PASSWORD 미설정 → 500 반환', async () => {
    const res = await POST(makeReq({ password: 'anything' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/configured/i);
  });

  it('빈 body → 400 (Zod 검증)', async () => {
    process.env.ADMIN_PASSWORD = 'secret';
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('password 200자 초과 → 400 (Zod 검증)', async () => {
    process.env.ADMIN_PASSWORD = 'secret';
    const res = await POST(makeReq({ password: 'x'.repeat(201) }));
    expect(res.status).toBe(400);
  });

  it('otp 20자 초과 → 400 (Zod 검증)', async () => {
    process.env.ADMIN_PASSWORD = 'secret';
    const res = await POST(makeReq({ password: 'secret', otp: '1'.repeat(21) }));
    expect(res.status).toBe(400);
  });

  it('잘못된 비밀번호 → 401 반환', async () => {
    process.env.ADMIN_PASSWORD = 'correct-pass';
    process.env.JWT_SECRET = 'test-secret';
    const res = await POST(makeReq({ password: 'wrong-pass' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('올바른 비밀번호 → 200 + auth 쿠키 발급', async () => {
    process.env.ADMIN_PASSWORD = 'correct-pass';
    process.env.JWT_SECRET = 'test-secret';
    const res = await POST(makeReq({ password: 'correct-pass' }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toMatch(/auth=/);
    expect(setCookie).toMatch(/httponly/i);
  });

  it('2FA 설정 시 OTP 없음 → 401 반환', async () => {
    process.env.ADMIN_PASSWORD = 'correct-pass';
    process.env.ADMIN_2FA_CODE = '123456';
    process.env.JWT_SECRET = 'test-secret';
    // otp defaults to '' via Zod, which != '123456'
    const res = await POST(makeReq({ password: 'correct-pass' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/two-factor/i);
  });

  it('2FA 설정 시 잘못된 OTP → 401 반환', async () => {
    process.env.ADMIN_PASSWORD = 'correct-pass';
    process.env.ADMIN_2FA_CODE = '123456';
    process.env.JWT_SECRET = 'test-secret';
    const res = await POST(makeReq({ password: 'correct-pass', otp: '000000' }));
    expect(res.status).toBe(401);
  });

  it('2FA 설정 시 올바른 OTP → 200 반환', async () => {
    process.env.ADMIN_PASSWORD = 'correct-pass';
    process.env.ADMIN_2FA_CODE = '123456';
    process.env.JWT_SECRET = 'test-secret';
    const res = await POST(makeReq({ password: 'correct-pass', otp: '123456' }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('올바른 비밀번호 + 2FA 미설정 → 200 반환 (OTP 무시)', async () => {
    process.env.ADMIN_PASSWORD = 'correct-pass';
    process.env.JWT_SECRET = 'test-secret';
    // ADMIN_2FA_CODE not set → any otp is ignored
    const res = await POST(makeReq({ password: 'correct-pass', otp: 'any-otp' }));
    expect(res.status).toBe(200);
  });
});
