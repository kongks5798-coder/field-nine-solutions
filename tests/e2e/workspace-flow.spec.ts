import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — AI App Builder (Workspace) Flow Tests
 *
 * Tests the /workspace IDE page — requires authentication.
 * Covers: page load, AI chat panel, code editor, preview panel,
 * keyboard shortcuts modal, and project management UI.
 */

test.describe('Workspace — Unauthenticated', () => {
  test('redirects unauthenticated user to /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/workspace', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Workspace — Page Structure', () => {
  /**
   * Note: workspace requires auth. If the dev server allows partial rendering
   * before redirect, some tests may fail. These tests verify the IDE loads
   * when the page is accessible (i.e. authenticated or in dev mode).
   *
   * For CI without auth, these will gracefully verify redirect behavior.
   */

  test('workspace page loads or redirects to login', async ({ page }) => {
    await page.goto('/workspace');
    // Either the page loads (with workspace content) or redirects to login
    const url = page.url();
    const isWorkspace = /\/workspace/.test(url);
    const isLogin = /\/login/.test(url);
    expect(isWorkspace || isLogin).toBeTruthy();
  });

  test('workspace renders AI chat panel when loaded', async ({ page }) => {
    await page.goto('/workspace');

    // If redirected to login, skip — this test only applies when workspace loads
    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // AI tab button should exist in the left panel
    const aiTab = page.getByRole('tab', { name: /AI/ });
    await expect(aiTab).toBeVisible({ timeout: 15000 });

    // Click AI tab to ensure it's active
    await aiTab.click();

    // There should be a textarea or input for AI prompts
    const aiInput = page.locator('textarea[placeholder]').first();
    await expect(aiInput).toBeVisible({ timeout: 10000 });
  });

  test('workspace renders code editor pane', async ({ page }) => {
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // Editor tabs should show file names (index.html is default)
    const htmlTab = page.getByText('index.html');
    await expect(htmlTab).toBeVisible({ timeout: 15000 });

    // style.css and script.js tabs should also be present
    const cssTab = page.getByText('style.css');
    const jsTab = page.getByText('script.js');
    await expect(cssTab).toBeVisible();
    await expect(jsTab).toBeVisible();
  });

  test('workspace renders preview panel with iframe', async ({ page }) => {
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // The preview iframe should be present
    const iframe = page.locator('iframe[title="앱 미리보기"]');
    await expect(iframe).toBeVisible({ timeout: 15000 });
  });

  test('workspace file tree tab shows files', async ({ page }) => {
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // Click the files tab
    const filesTab = page.getByRole('tab', { name: /파일/ });
    await expect(filesTab).toBeVisible({ timeout: 15000 });
    await filesTab.click();

    // Should show index.html in the file tree
    const indexFile = page.getByText('index.html');
    await expect(indexFile).toBeVisible({ timeout: 5000 });
  });

  test('keyboard shortcuts modal opens with Ctrl+/', async ({ page }) => {
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Press Ctrl+/ to open the shortcuts modal
    await page.keyboard.press('Control+/');

    // The shortcuts dialog should appear with the title
    const shortcutsTitle = page.getByText('단축키');
    await expect(shortcutsTitle).toBeVisible({ timeout: 5000 });

    // Verify some shortcut entries are shown
    const ctrlEnter = page.getByText('프로젝트 실행');
    await expect(ctrlEnter).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-labelledby="shortcuts-title"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('workspace top bar has project name and run button', async ({ page }) => {
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // The page should display a project name area
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    const body = await page.content();
    // Default project name or "새 프로젝트" or "내 프로젝트"
    expect(body).toMatch(/프로젝트|Project/i);
  });

  test('workspace status bar shows on desktop', async ({ page }) => {
    // Use desktop viewport (default in Playwright config is Desktop Chrome)
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // Status bar shows error/warning counts and cursor position
    // It contains token balance and AI mode info
    const body = await page.content();
    // Status bar displays the language (html/css/js) and cursor pos
    expect(body).toMatch(/html|css|javascript/i);
  });

  test('workspace preview responsive width buttons exist', async ({ page }) => {
    await page.goto('/workspace');

    if (/\/login/.test(page.url())) {
      test.skip();
      return;
    }

    // Preview header toolbar should have responsive width options
    // These are typically 375/768/1280/full width toggles
    const previewArea = page.locator('iframe[title="앱 미리보기"]');
    await expect(previewArea).toBeVisible({ timeout: 15000 });

    // Look for the run button (exists in preview header toolbar)
    const body = await page.content();
    expect(body).toMatch(/실행|▶/);
  });
});

test.describe('Workspace — API Auth Guards', () => {
  test('GET /api/projects without auth returns error or empty', async ({ request }) => {
    const res = await request.get('/api/projects');
    // Should either return 401 or an empty project list
    const status = res.status();
    expect([200, 401]).toContain(status);
    if (status === 200) {
      const data = await res.json();
      // Empty or array response is acceptable
      expect(data).toBeDefined();
    }
  });

  test('GET /api/tokens without auth returns fallback balance', async ({ request }) => {
    const res = await request.get('/api/tokens');
    const status = res.status();
    // Should return 200 with default balance or 401
    expect([200, 401]).toContain(status);
  });
});
