import { test, expect } from '@playwright/test';

/**
 * 로그인 플로우 E2E 테스트
 * 
 * 카카오톡/구글 OAuth 로그인 테스트
 * NextAuth.js 세션 관리 확인
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 정상적으로 로드됨', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Field Nine/);
    
    // Field Nine 로고 확인
    const logo = page.locator('text=Field Nine').first();
    await expect(logo).toBeVisible();
    
    // 카카오톡 로그인 버튼 확인
    const kakaoButton = page.locator('button:has-text("카카오톡"), button:has-text("Kakao")');
    await expect(kakaoButton).toBeVisible();
    
    // 구글 로그인 버튼 확인
    const googleButton = page.locator('button:has-text("구글"), button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test('카카오톡 로그인 버튼 클릭 시 OAuth 리다이렉트', async ({ page }) => {
    // 카카오톡 로그인 버튼 클릭
    const kakaoButton = page.locator('button:has-text("카카오톡"), button:has-text("Kakao")');
    await kakaoButton.click();
    
    // OAuth 리다이렉트 확인 (카카오톡 로그인 페이지로 이동)
    // 실제 OAuth 테스트는 환경 변수 설정 후 가능
    await page.waitForTimeout(1000);
    
    // URL이 변경되었는지 확인 (OAuth Provider로 리다이렉트)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('구글 로그인 버튼 클릭 시 OAuth 리다이렉트', async ({ page }) => {
    // 구글 로그인 버튼 클릭
    const googleButton = page.locator('button:has-text("구글"), button:has-text("Google")');
    await googleButton.click();
    
    // OAuth 리다이렉트 확인
    await page.waitForTimeout(1000);
    
    // URL이 변경되었는지 확인
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('로그인 후 대시보드로 리다이렉트', async ({ page, context }) => {
    // 세션 쿠키 설정 (로그인 시뮬레이션)
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 로그인 페이지 접근 시 대시보드로 리다이렉트되는지 확인
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // 대시보드로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
  });
});
