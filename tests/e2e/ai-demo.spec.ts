import { test, expect } from '@playwright/test';

/**
 * FieldNine API 기능 E2E 테스트
 */
test.describe('API Endpoints', () => {
  test('GET /api/health — 정상 응답 구조 반환', async ({ request }) => {
    const res = await request.get('/api/health');
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(['ok', 'degraded', 'down']).toContain(body.status);
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('latencyMs');
    expect(body.components).toHaveProperty('api');
    expect(body.components).toHaveProperty('database');
  });

  test('GET /api/health — 시크릿 정보 미노출', async ({ request }) => {
    const res = await request.get('/api/health');
    const text = JSON.stringify(await res.json());
    expect(text).not.toMatch(/sk_/);
    expect(text).not.toMatch(/SERVICE_ROLE_KEY/);
    expect(text).not.toMatch(/OPENAI_API_KEY/);
  });

  test('GET /api/docs — OpenAPI 문서 반환', async ({ request }) => {
    const res = await request.get('/api/docs');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toContain('FieldNine');
  });

  test('POST /api/tokens — 미인증 시 401 반환', async ({ request }) => {
    const res = await request.patch('/api/tokens', {
      data: { delta: -100 },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/contact — 잘못된 이메일은 400 반환', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: '홍길동', email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/contact — 유효한 요청은 200 반환', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: '홍길동', email: 'test@example.com', message: '문의합니다' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
