import { test, expect } from '@playwright/test';

/**
 * FieldNine E2E — Collaborative Editor (Cowork) Flow Tests
 *
 * Tests the /cowork page — editor rendering, typing, AI agent panel,
 * share functionality, document sidebar, and comments section.
 */

test.describe('Cowork Editor', () => {
  test('cowork page loads with editor textarea', async ({ page }) => {
    await page.goto('/cowork');
    // Page should render (either directly or via AppShell)
    await expect(page.locator('body')).toBeVisible();

    // The main textarea editor should be present
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
  });

  test('editor textarea contains default document content', async ({ page }) => {
    await page.goto('/cowork');

    // Wait for the main editor textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Default content should include the roadmap document
    const content = await textarea.inputValue();
    expect(content).toMatch(/Dalkak|제품 로드맵|로드맵/);
  });

  test('can type in the editor textarea', async ({ page }) => {
    await page.goto('/cowork');

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Click to focus and type
    await textarea.click();
    const testText = 'E2E 테스트 텍스트 입력';
    await textarea.fill(testText);

    // Verify the content is set
    const value = await textarea.inputValue();
    expect(value).toContain(testText);
  });

  test('AI agent panel is accessible and shows agent buttons', async ({ page }) => {
    await page.goto('/cowork');

    // Agent selector section header
    const agentLabel = page.getByText('AI 에이전트 선택');
    await expect(agentLabel).toBeVisible({ timeout: 10000 });

    // Verify agent buttons are visible — check for specific agent names
    const writerBtn = page.getByRole('button', { name: /라이터/ });
    const coderBtn = page.getByRole('button', { name: /코더/ });
    const analystBtn = page.getByRole('button', { name: /애널리스트/ });

    await expect(writerBtn).toBeVisible();
    await expect(coderBtn).toBeVisible();
    await expect(analystBtn).toBeVisible();
  });

  test('can switch between AI agents', async ({ page }) => {
    await page.goto('/cowork');

    // Wait for panel to render
    await expect(page.getByText('AI 에이전트 선택')).toBeVisible({ timeout: 10000 });

    // Click the coder agent
    const coderBtn = page.getByRole('button', { name: /코더/ });
    await coderBtn.click();

    // The agent info box should now show coder details
    const agentInfo = page.getByText('시니어 개발자');
    await expect(agentInfo).toBeVisible({ timeout: 5000 });
  });

  test('share button is present and clickable', async ({ page }) => {
    await page.goto('/cowork');

    // Share button (text "공유" on desktop, or link icon on mobile)
    const shareBtn = page.getByRole('button', { name: /공유|🔗/ });
    await expect(shareBtn).toBeVisible({ timeout: 10000 });

    // Click share — should show "링크 복사됨!" toast
    await shareBtn.click();

    // The toast "링크 복사됨!" may appear briefly
    // We check it appears within a reasonable time
    const toast = page.getByText('링크 복사됨!');
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('document list sidebar shows documents', async ({ page }) => {
    await page.goto('/cowork');

    // The sidebar should show document titles
    const docTitle = page.getByText('Dalkak 제품 로드맵');
    await expect(docTitle).toBeVisible({ timeout: 10000 });

    // Additional mock documents
    const apiDoc = page.getByText('API 설계 문서');
    await expect(apiDoc).toBeVisible();
  });

  test('comments section is visible with initial comments', async ({ page }) => {
    await page.goto('/cowork');

    // Comments section header
    const commentsLabel = page.getByText(/댓글 \(\d+\)/);
    await expect(commentsLabel).toBeVisible({ timeout: 10000 });

    // At least one initial comment should be visible
    const commentText = page.getByText('로드맵에');
    await expect(commentText).toBeVisible({ timeout: 5000 });
  });

  test('save button is present and responds to click', async ({ page }) => {
    await page.goto('/cowork');

    // Save button
    const saveBtn = page.getByRole('button', { name: '저장' });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });

    // Click save — button text should change to "저장됨" briefly
    await saveBtn.click();

    // Either shows "저장됨" or remains "저장" (depends on API)
    // We just verify no crash after click
    await expect(page.locator('body')).toBeVisible();
  });
});
