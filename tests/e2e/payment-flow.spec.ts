import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — Payment UI Flow Tests
 *
 * Tests the pricing page, plan cards, payment provider selection,
 * FAQ section, billing page auth guard, and checkout API auth checks.
 */

test.describe('Payment Flow', () => {
  test('pricing page loads with plan cards', async ({ page }) => {
    await page.goto('/pricing');
    // Should NOT redirect to login — pricing is public
    await expect(page).not.toHaveURL(/login/);

    // Verify the page body contains plan names (Pro / Team)
    const body = await page.content();
    expect(body).toMatch(/프로|Pro|pro/);
    expect(body).toMatch(/팀|Team|team/i);

    // Verify at least 2 plan cards are visible via the plan grid
    const planGrid = page.locator('.plan-grid');
    await expect(planGrid).toBeVisible({ timeout: 10000 });

    // Each plan card has a CTA button — expect at least 2
    const ctaButtons = planGrid.locator('button');
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('pricing page displays payment provider selection', async ({ page }) => {
    await page.goto('/pricing');

    // The payment provider section heading
    const providerSection = page.getByText('결제 수단 선택');
    await expect(providerSection).toBeVisible({ timeout: 10000 });

    // Verify all three providers are listed: Stripe, 토스페이먼츠, Polar
    const body = await page.content();
    expect(body).toMatch(/Stripe/);
    expect(body).toMatch(/토스페이먼츠/);
    expect(body).toMatch(/Polar/);
  });

  test('pricing page shows FAQ section with accordion', async ({ page }) => {
    await page.goto('/pricing');

    // FAQ heading
    const faqHeading = page.getByText('자주 묻는 질문');
    await expect(faqHeading).toBeVisible({ timeout: 10000 });

    // Click first FAQ question to expand it
    const firstQuestion = page.getByText('언제든지 취소할 수 있나요?');
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.click();

    // The answer should appear
    const answer = page.getByText('남은 기간을 일할 계산해 환불합니다', { exact: false });
    await expect(answer).toBeVisible({ timeout: 5000 });
  });

  test('unauthenticated user is redirected to login from billing', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/billing', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('billing API requires authentication — GET /api/billing/usage returns 401', async ({ request }) => {
    const res = await request.get('/api/billing/usage');
    expect(res.status()).toBe(401);
  });

  test('billing API requires authentication — POST /api/billing/checkout returns 401', async ({ request }) => {
    const res = await request.post('/api/billing/checkout', {
      data: { plan: 'pro', provider: 'stripe' },
    });
    expect(res.status()).toBe(401);
  });

  test('billing checkout rejects invalid plan', async ({ request }) => {
    const res = await request.post('/api/billing/checkout', {
      data: { plan: 'nonexistent_plan' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('pricing page renders billing period toggle (monthly / yearly)', async ({ page }) => {
    await page.goto('/pricing');

    // Monthly and yearly toggle buttons
    const monthlyBtn = page.getByText('월간');
    const yearlyBtn = page.getByText('연간 (추가 11% 할인)');

    await expect(monthlyBtn).toBeVisible({ timeout: 10000 });
    await expect(yearlyBtn).toBeVisible();

    // Click yearly and check savings badge appears
    await yearlyBtn.click();
    // Wait for savings badge text to appear
    await expect(page.getByText(/절약/, { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('pricing page shows contact form for team inquiries', async ({ page }) => {
    await page.goto('/pricing');

    // The contact form section
    const contactHeading = page.getByText('팀/엔터프라이즈 맞춤 문의');
    await expect(contactHeading).toBeVisible({ timeout: 10000 });

    // Verify form fields
    const nameInput = page.locator('#contact-form input[placeholder="홍길동"]');
    const emailInput = page.locator('#contact-form input[type="email"]');
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
  });
});
