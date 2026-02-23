import { test, expect } from '@playwright/test';

/**
 * FieldNine 핵심 페이지 & PWA E2E 테스트
 */
test.describe('Core Pages', () => {
  test('홈페이지 — Dalkak 브랜드가 보인다', async ({ page }) => {
    await page.goto('/');
    const body = await page.content();
    expect(body).toMatch(/Dalkak|dalkak|딸깍|fieldnine/i);
  });

  test('offline.html — 오프라인 페이지 로드', async ({ page }) => {
    const res = await page.goto('/offline.html');
    expect(res?.status()).toBe(200);
    const body = await page.content();
    expect(body).toMatch(/오프라인|offline/i);
  });

  test('status 페이지 — 컴포넌트 상태 표시', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('body')).toBeVisible();
    const body = await page.content();
    expect(body).toMatch(/api|database|AI/i);
  });
});

test.describe('PWA', () => {
  test('sw.js — Service Worker 파일이 로드된다', async ({ page }) => {
    const res = await page.goto('/sw.js');
    expect(res?.status()).toBe(200);
  });

  test('GET /api/health — Cache-Control: no-store 헤더', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.headers()['cache-control']).toContain('no-store');
  });
});

test.describe('Rate Limiting', () => {
  test('API 엔드포인트 — 비인증 요청에 401 반환', async ({ request }) => {
    const res = await request.get('/api/billing/usage');
    expect(res.status()).toBe(401);
  });
});

test.describe('Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('홈페이지가 모바일에서 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // 가로 스크롤 없어야 함
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(400);
  });
});
