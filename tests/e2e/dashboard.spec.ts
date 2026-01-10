import { test, expect } from '@playwright/test';

/**
 * 대시보드 E2E 테스트
 * 
 * 대시보드 페이지 로드 및 기능 확인
 */
test.describe('Dashboard', () => {
  test('대시보드 페이지 접근 시 로그인 페이지로 리다이렉트 (미로그인)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('대시보드 페이지 정상 로드 (로그인 상태)', async ({ page, context }) => {
    // 세션 쿠키 설정
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    
    // 대시보드 제목 확인
    const dashboardTitle = page.locator('text=Dashboard, text=대시보드').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 5000 });
  });

  test('사이드바 네비게이션 메뉴 표시', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    
    // 사이드바 메뉴 확인
    const inventoryLink = page.locator('a:has-text("Inventory"), a:has-text("재고")');
    const ordersLink = page.locator('a:has-text("Orders"), a:has-text("주문")');
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("설정")');
    
    await expect(inventoryLink).toBeVisible({ timeout: 5000 });
    await expect(ordersLink).toBeVisible({ timeout: 5000 });
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
  });
});
