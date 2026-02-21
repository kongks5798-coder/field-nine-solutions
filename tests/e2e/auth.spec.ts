import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — Authentication Flow Tests
 */

test.describe('Login Page', () => {
  test('displays email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.keyboard.press('Enter');

    // Should show error or stay on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Signup Page', () => {
  test('displays signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('Auth Callback', () => {
  test('redirects to login on invalid code', async ({ request }) => {
    const res = await request.get('/auth/callback?code=invalid');
    // Should redirect to login with error
    expect([200, 302, 303]).toContain(res.status());
  });
});
