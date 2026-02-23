import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E - Smoke Tests
 */

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Dalkak/i);
  });

  test('health API returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(
      page.locator('form, [role="form"], input[type="email"], input[type="password"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input, form')).toBeVisible({ timeout: 10000 });
  });

  test('docs page loads', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('body')).toContainText(/API|Documentation/i);
  });
});
