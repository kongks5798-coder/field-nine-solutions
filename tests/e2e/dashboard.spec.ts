import { test, expect } from '@playwright/test';

/**
 * FieldNine 인증 게이트 E2E 테스트
 */
test.describe('Auth Guard', () => {
  const PROTECTED = ['/workspace', '/analytics', '/cloud', '/cowork', '/team', '/settings', '/domains'];

  for (const path of PROTECTED) {
    test(`${path} — 미인증 시 /login 리다이렉트`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/login/);
    });
  }

  test('admin 경로 — 미인증 시 /login 리다이렉트', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Public Pages', () => {
  test('홈페이지가 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('로그인 페이지에 이메일 필드가 있다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('pricing 페이지가 로드된다', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('status 페이지가 로드된다', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('body')).toBeVisible();
  });
});
