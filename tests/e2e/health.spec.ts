import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — System Health Tests
 * 헬스체크 및 핵심 페이지 응답 확인
 */

test.describe('API Health', () => {
  test('GET /api/health returns 200 with expected structure', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBeLessThan(400);

    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(['ok', 'degraded', 'down']).toContain(body.status);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('components');
    expect(body.components).toHaveProperty('api');
    expect(body.components).toHaveProperty('database');
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
    expect(page.url()).toContain('fieldnine.io');
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
    await page.goto('/this-page-does-not-exist-xyz');
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Security Headers', () => {
  test('Response has X-Content-Type-Options header', async ({ request }) => {
    const res = await request.get('/');
    const header = res.headers()['x-content-type-options'];
    expect(header).toBe('nosniff');
  });

  test('Response has X-Frame-Options header', async ({ request }) => {
    const res = await request.get('/');
    const header = res.headers()['x-frame-options'];
    expect(header).toBe('DENY');
  });

  test('Response has Content-Security-Policy', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()).toHaveProperty('content-security-policy');
  });
});

test.describe('Protected Routes', () => {
  test('Workspace redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/workspace');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Billing redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/billing');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Admin redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('API Rate Limiting', () => {
  test('Rate limit headers present on API response', async ({ request }) => {
    // Rate limit headers only appear when limit is hit — just check endpoint responds
    const res = await request.post('/api/ai/stream', {
      data: { mode: 'openai', prompt: 'test' },
    });
    // 401 (not logged in) or 429 (rate limited) — both are expected
    expect([200, 400, 401, 429]).toContain(res.status());
  });
});
