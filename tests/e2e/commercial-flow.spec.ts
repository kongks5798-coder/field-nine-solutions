import { test, expect } from '@playwright/test';

/**
 * FieldNine 핵심 결제 플로우 E2E 테스트
 */
test.describe('FieldNine Pricing & Billing', () => {
  test('pricing 페이지가 로드된다', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).not.toHaveURL(/login/);
    // 요금제 정보 포함 여부
    const body = await page.content();
    expect(body).toMatch(/pro|Pro|team|Team/i);
  });

  test('workspace는 미인증 시 /login으로 리다이렉트한다', async ({ page }) => {
    await page.goto('/workspace');
    await expect(page).toHaveURL(/login/);
  });

  test('settings는 미인증 시 /login으로 리다이렉트한다', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/login/);
  });

  test('billing 페이지는 미인증 시 /login으로 리다이렉트한다', async ({ page }) => {
    await page.goto('/billing');
    await expect(page).toHaveURL(/login/);
  });

  test('POST /api/billing/checkout — 미인증 시 401 반환', async ({ request }) => {
    const res = await request.post('/api/billing/checkout', {
      data: { plan: 'pro', provider: 'stripe' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/billing/checkout — 잘못된 plan은 401 또는 400 반환', async ({ request }) => {
    const res = await request.post('/api/billing/checkout', {
      data: { plan: 'admin' },
    });
    expect([400, 401]).toContain(res.status());
  });
});
