import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — Authentication Flow Tests
 */

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays email and password fields', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    // 명시적 submit — Enter 키는 포커스 상태에 따라 불안정
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Signup Page', () => {
  test('displays signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth Callback', () => {
  test('redirects (not 200) on invalid code', async ({ request }) => {
    const res = await request.get('/auth/callback?code=invalid');
    // 200은 절대 불가 — invalid code로 성공 응답이면 테스트 실패
    expect([302, 303, 307, 308, 400, 401]).toContain(res.status());
  });

  test('handles missing code parameter', async ({ request }) => {
    const res = await request.get('/auth/callback');
    expect([302, 303, 307, 308, 400, 401]).toContain(res.status());
  });
});

test.describe('Session Management', () => {
  test('unauthenticated user redirects from /workspace to /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/workspace', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user redirects from /admin to /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });
});
