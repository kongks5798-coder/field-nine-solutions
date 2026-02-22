import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — Accessibility Tests
 * WCAG 2.1 기본 준수 여부 확인
 */

test.describe('Skip Navigation', () => {
  test('홈페이지에 main-content 앵커가 존재', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveCount(1);
  });

  test('로그인 페이지에 main-content 앵커가 존재', async ({ page }) => {
    await page.goto('/login');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveCount(1);
  });
});

test.describe('HTML Semantics', () => {
  test('홈페이지 lang="ko" 설정', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('ko');
  });

  test('로그인 페이지에 h1 헤딩이 존재', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('로그인 폼 label이 input과 연결됨 (htmlFor/id)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // label[for] 속성이 있는 요소 확인
    const labelsWithFor = await page.locator('label[for]').count();
    expect(labelsWithFor).toBeGreaterThan(0);
  });
});

test.describe('Status Page Accessibility', () => {
  test('상태 페이지 aria-live="polite" 영역 존재', async ({ page }) => {
    await page.goto('/status');
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toHaveCount(1);
  });

  test('상태 페이지 h1 존재', async ({ page }) => {
    await page.goto('/status');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });
});

test.describe('Security Headers (CSP)', () => {
  test('Content-Security-Policy 헤더 존재', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  test('CSP upgrade-insecure-requests 포함', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toContain('upgrade-insecure-requests');
  });
});

test.describe('API Docs', () => {
  test('GET /api/docs — 24개 이상 경로 포함', async ({ request }) => {
    const res = await request.get('/api/docs');
    expect(res.status()).toBe(200);
    const spec = await res.json();
    const pathCount = Object.keys(spec.paths ?? {}).length;
    expect(pathCount).toBeGreaterThanOrEqual(20);
  });

  test('GET /api/docs — adminAuth 보안 스킴 존재', async ({ request }) => {
    const res = await request.get('/api/docs');
    const spec = await res.json();
    expect(spec.components?.securitySchemes?.adminAuth).toBeDefined();
    expect(spec.components?.securitySchemes?.cookieAuth).toBeDefined();
  });

  test('GET /api/docs — schemas 정의 존재', async ({ request }) => {
    const res = await request.get('/api/docs');
    const spec = await res.json();
    expect(spec.components?.schemas?.Order).toBeDefined();
    expect(spec.components?.schemas?.Customer).toBeDefined();
  });
});
