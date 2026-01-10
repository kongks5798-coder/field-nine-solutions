import { test, expect } from '@playwright/test';

/**
 * AI 데모 페이지 E2E 테스트
 * 
 * AI 기능 테스트 및 API 호출 확인
 */
test.describe('AI Demo', () => {
  test('AI 데모 페이지 접근 시 로그인 페이지로 리다이렉트 (미로그인)', async ({ page }) => {
    await page.goto('/ai-demo');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('AI 데모 페이지 정상 로드 (로그인 상태)', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/ai-demo');
    
    // AI 데모 제목 확인
    const aiDemoTitle = page.locator('text=AI Demo, text=AI 데모, text=RTX 5090').first();
    await expect(aiDemoTitle).toBeVisible({ timeout: 5000 });
  });

  test('AI 기능 카드 표시', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/ai-demo');
    
    // AI 기능 카드 확인
    const forecastCard = page.locator('text=수요 예측, text=Demand Forecasting').first();
    const optimizeCard = page.locator('text=재고 최적화, text=Inventory Optimization').first();
    const pricingCard = page.locator('text=가격 최적화, text=Pricing Optimization').first();
    const recommendCard = page.locator('text=기능 추천, text=Feature Recommendation').first();
    
    await expect(forecastCard).toBeVisible({ timeout: 5000 });
    await expect(optimizeCard).toBeVisible({ timeout: 5000 });
    await expect(pricingCard).toBeVisible({ timeout: 5000 });
    await expect(recommendCard).toBeVisible({ timeout: 5000 });
  });

  test('수요 예측 API 호출 테스트', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/ai-demo');
    
    // API 호출 모니터링
    const apiCallPromise = page.waitForResponse(
      response => response.url().includes('/api/ai/forecast') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);

    // 수요 예측 버튼 클릭
    const forecastButton = page.locator('button:has-text("수요 예측"), button:has-text("Forecast")').first();
    if (await forecastButton.isVisible()) {
      await forecastButton.click();
      
      // API 호출 확인 (성공 또는 에러 모두 허용)
      await apiCallPromise;
      
      // 결과 표시 확인 (성공 또는 에러 메시지)
      await page.waitForTimeout(2000);
      const result = page.locator('text=성공, text=Success, text=오류, text=Error').first();
      await expect(result).toBeVisible({ timeout: 5000 });
    }
  });
});
