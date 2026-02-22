import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { POST, DELETE } from '@/app/api/auth/gate/route';

function makePost(body: unknown, search = '') {
  return new NextRequest(`http://localhost/api/auth/gate${search}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/gate', () => {
  beforeEach(() => {
    delete process.env.SITE_GATE_PASSWORD;
    delete process.env.SITE_GATE_TOKEN;
  });

  it('환경변수 미설정 → 500 반환', async () => {
    const res = await POST(makePost({ password: 'anything' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('password 없음 → 400 반환', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'gate-token';
    const res = await POST(makePost({}));
    expect(res.status).toBe(400);
  });

  it('password 64자 초과 → 400 반환', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'gate-token';
    const res = await POST(makePost({ password: 'x'.repeat(65) }));
    expect(res.status).toBe(400);
  });

  it('잘못된 비밀번호 → 401 반환', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'gate-token';
    const res = await POST(makePost({ password: 'wrong' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('올바른 비밀번호 → 200 + f9_gate 쿠키 설정', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'my-secret-token';
    const res = await POST(makePost({ password: 'gate-pass' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.redirect).toBe('/');
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toMatch(/f9_gate=/);
    expect(setCookie).toMatch(/my-secret-token/);
    expect(setCookie).toMatch(/httponly/i);
  });

  it('next=/dashboard → redirect: /dashboard 반환', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'gate-token';
    const res = await POST(makePost({ password: 'gate-pass' }, '?next=/dashboard'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe('/dashboard');
  });

  it('next=//evil.com → redirect: / (오픈 리다이렉트 방지)', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'gate-token';
    const res = await POST(makePost({ password: 'gate-pass' }, '?next=//evil.com'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe('/');
  });

  it('next=http://phish.com → redirect: / (외부 URL 차단)', async () => {
    process.env.SITE_GATE_PASSWORD = 'gate-pass';
    process.env.SITE_GATE_TOKEN = 'gate-token';
    const res = await POST(makePost({ password: 'gate-pass' }, '?next=http://phish.com'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe('/');
  });
});

describe('DELETE /api/auth/gate', () => {
  it('로그아웃 → 200 + f9_gate 쿠키 만료', async () => {
    const req = new NextRequest('http://localhost/api/auth/gate', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toMatch(/f9_gate=/);
    expect(setCookie).toMatch(/max-age=0/i);
  });
});
