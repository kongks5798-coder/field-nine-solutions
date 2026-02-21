import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 *
 * Field Nine 프로젝트의 E2E 테스트를 위한 설정
 */
export default defineConfig({
  testDir: './tests/e2e',

  // CI에서는 직렬 실행 (레이스 컨디션 방지)
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 타임아웃
  timeout: 60 * 1000,        // 테스트당 최대 60초
  expect: { timeout: 10 * 1000 }, // expect 단언 10초

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.PLAYWRIGHT_STAGING_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,     // 개별 액션 10초
    navigationTimeout: 30 * 1000, // 페이지 이동 30초
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  outputDir: 'test-results',

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
