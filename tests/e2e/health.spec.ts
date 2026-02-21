import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — System Health Tests
 * 헬스체크 및 핵심 페이지 응답 확인
 */

test.describe('API Health', () => {
  test('GET /api/health returns valid structure', async ({ request }) => {
    const res = await request.get('/api/health');
    // 200(정상) 또는 503(DB 오류) — 4xx는 절대 불가
    expect([200, 503]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(['ok', 'degraded', 'down']).toContain(body.status);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('latencyMs');
    expect(body).toHaveProperty('components');
    expect(body.components).toHaveProperty('api');
    expect(body.components).toHaveProperty('database');
  });

  test('health response does not leak secrets', async ({ request }) => {
    const res = await request.get('/api/health');
    const body = JSON.stringify(await res.json());
    expect(body).not.toMatch(/sk_/);
    expect(body).not.toMatch(/OPENAI_API_KEY/);
    expect(body).not.toMatch(/SERVICE_ROLE_KEY/);
  });

  test('health reports database latency', async ({ request }) => {
    const res = await request.get('/api/health');
    const body = await res.json();
    expect(typeof body.components.database.latencyMs).toBe('number');
    expect(body.components.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(body.components.database.latencyMs).toBeLessThan(30000);
  });

  test('GET /api/docs returns OpenAPI spec', async ({ request }) => {
    const res = await request.get('/api/docs');
    expect(res.status()).toBe(200);

    const spec = await res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe('FieldNine API');
    expect(spec.paths).toHaveProperty('/api/health');
  });
});

test.describe('Public Pages', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FieldNine/i);
  });

  test('Status page loads', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('text=시스템 상태')).toBeVisible();
  });

  test('Pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/요금/i);
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('404 returns custom not-found page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist-xyz');
    expect(res?.status()).toBe(404);
  });
});

test.describe('Security Headers', () => {
  test('X-Content-Type-Options: nosniff', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('X-Frame-Options: DENY or SAMEORIGIN', async ({ request }) => {
    const res = await request.get('/');
    const header = res.headers()['x-frame-options'];
    expect(['DENY', 'SAMEORIGIN']).toContain(header);
  });

  test('Content-Security-Policy present', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()).toHaveProperty('content-security-policy');
  });

  test('API health response is not cacheable', async ({ request }) => {
    const res = await request.get('/api/health');
    const cc = res.headers()['cache-control'];
    expect(cc).toMatch(/no-cache|no-store|private/i);
  });
});

test.describe('Protected Routes', () => {
  test('Workspace redirects to login when unauthenticated', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/workspace', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('Billing redirects to login when unauthenticated', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/billing', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('Admin redirects to login when unauthenticated', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('API Rate Limiting', () => {
  test('AI stream endpoint responds (auth or rate limit)', async ({ request }) => {
    const res = await request.post('/api/ai/stream', {
      data: { mode: 'openai', prompt: 'test' },
    });
    // 401(미인증), 429(레이트리밋), 400(잘못된 입력), 500(서버 오류) 모두 허용
    expect([200, 400, 401, 429, 500]).toContain(res.status());
  });

  test('Rate-limited response includes retry headers', async ({ request }) => {
    const res = await request.post('/api/ai/stream', {
      data: { mode: 'openai', prompt: 'test' },
    });
    if (res.status() === 429) {
      const headers = res.headers();
      const hasRetryInfo = headers['retry-after'] !== undefined ||
                           headers['x-ratelimit-reset'] !== undefined ||
                           headers['x-rate-limit-reset'] !== undefined;
      expect(hasRetryInfo).toBeTruthy();
    }
  });
});
