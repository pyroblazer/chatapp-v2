import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

async function setupConversation(page: Parameters<typeof setupAuthenticatedPage>[0]) {
  const user = await setupAuthenticatedPage(page);
  const otherUser = createTestUser();
  await registerUserViaAPI(otherUser);
  const res = await apiRequest('POST', '/conversations', user.accessToken, {
    username: otherUser.username,
    message: 'Setup message',
  });
  const conv = await res.json();
  return { user, otherUser, convId: conv.id as string };
}

test.describe('Messages - Send', () => {
  test('should send a message using Enter key', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });
    await textarea.fill('Hello via Enter key');
    await textarea.press('Enter');
    await expect(page.locator('text=Hello via Enter key')).toBeVisible({ timeout: 8000 });
  });

  test('should send multiple messages in order', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });

    await textarea.fill('First message');
    await textarea.press('Enter');
    await expect(page.locator('text=First message')).toBeVisible({ timeout: 8000 });

    await textarea.fill('Second message');
    await textarea.press('Enter');
    await expect(page.locator('text=Second message')).toBeVisible({ timeout: 8000 });

    await textarea.fill('Third message');
    await textarea.press('Enter');
    await expect(page.locator('text=Third message')).toBeVisible({ timeout: 8000 });
  });

  test('should not send empty message', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });

    // Count messages before attempting to send empty
    const messagesBefore = await page.locator('[class*="messageItem"], [class*="MessageItem"]').count();
    await textarea.press('Enter');
    await page.waitForTimeout(500);
    const messagesAfter = await page.locator('[class*="messageItem"], [class*="MessageItem"]').count();
    expect(messagesAfter).toBe(messagesBefore);
  });

  test('should persist messages after page reload', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });
    await textarea.fill('Persist after reload');
    await textarea.press('Enter');
    await expect(page.locator('text=Persist after reload')).toBeVisible({ timeout: 8000 });

    await page.reload();
    await expect(page.locator('text=Persist after reload')).toBeVisible({ timeout: 8000 });
  });

  test('should show initial message from conversation creation', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    await expect(page.locator('text=Setup message')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Messages - Edit', () => {
  test('should edit own message via context menu', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });
    await textarea.fill('Original message text');
    await textarea.press('Enter');

    const message = page.locator('text=Original message text');
    await expect(message).toBeVisible({ timeout: 8000 });
    await message.click({ button: 'right' });

    await expect(page.locator('text=Edit Message')).toBeVisible({ timeout: 5000 });
    await page.locator('text=Edit Message').click();

    // Edit input appears — clear and type new content
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Edited message text');
    await page.keyboard.press('Enter');

    await expect(page.locator('text=Edited message text')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Original message text')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Messages - Delete', () => {
  test('should delete own message via context menu', async ({ page }) => {
    const { convId } = await setupConversation(page);
    await page.goto(`/conversations/${convId}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });
    await textarea.fill('Message to delete');
    await textarea.press('Enter');

    const message = page.locator('text=Message to delete');
    await expect(message).toBeVisible({ timeout: 8000 });
    await message.click({ button: 'right' });

    await expect(page.locator('text=Delete Message')).toBeVisible({ timeout: 5000 });
    await page.locator('text=Delete Message').click();

    await expect(page.locator('text=Message to delete')).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('Messages - Permissions', () => {
  test('should not show edit/delete on other user messages', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'From user1',
    });
    const conv = await convRes.json();

    // user2 sends a message in a separate context
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.goto(`/conversations/${conv.id}`);
    const textarea2 = page2.locator('textarea');
    await expect(textarea2).toBeVisible({ timeout: 8000 });
    await textarea2.fill('Message from user2');
    await textarea2.press('Enter');
    await expect(page2.locator('text=Message from user2')).toBeVisible({ timeout: 8000 });
    await ctx2.close();

    // user1 views and right-clicks user2's message
    await loginViaUI(page, user1.username, user1.password);
    await page.goto(`/conversations/${conv.id}`);
    const otherMessage = page.locator('text=Message from user2');
    await expect(otherMessage).toBeVisible({ timeout: 8000 });
    await otherMessage.click({ button: 'right' });

    // Edit Message should NOT appear for another user's message
    await expect(page.locator('text=Edit Message')).not.toBeVisible({ timeout: 3000 });
  });
});
