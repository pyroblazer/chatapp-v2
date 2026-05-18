import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  makeFriends,
  navigateToConversation,
} from '../setup/test-fixtures';

async function setupConversation(page: Parameters<typeof setupAuthenticatedPage>[0]) {
  const user = await setupAuthenticatedPage(page);
  const otherUser = createTestUser();
  await registerUserViaAPI(otherUser);
  const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
  await makeFriends(user.accessToken, otherUser.username, token2);

  const res = await apiRequest('POST', '/conversations', user.accessToken, {
    username: otherUser.username,
    message: 'Setup message',
  });
  expect(res.ok).toBeTruthy();
  const conv = await res.json();
  const convId = conv.id as string;

  // Navigate via sidebar click (avoids full page reload + guard redirect)
  await navigateToConversation(page, convId, `${otherUser.firstName} ${otherUser.lastName}`);

  return { user, otherUser, token2, convId };
}

test.describe('Messages - Send', () => {
  test('should send a message using Enter key', async ({ page }) => {
    await setupConversation(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Hello via Enter key');
    await textarea.press('Enter');
    await expect(page.locator('text=Hello via Enter key')).toBeVisible({ timeout: 8000 });
  });

  test('should send multiple messages in order', async ({ page }) => {
    await setupConversation(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    for (const msg of ['First message', 'Second message', 'Third message']) {
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/messages') && resp.request().method() === 'POST',
          { timeout: 10000 }
        ),
        textarea.fill(msg).then(() => textarea.press('Enter')),
      ]);
      await expect(page.locator(`text=${msg}`).last()).toBeVisible({ timeout: 8000 });
    }
  });

  test('should persist messages after page reload', async ({ page }) => {
    const { convId } = await setupConversation(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Persist after reload');
    // Wait for the POST to complete so the message is in the DB before reload
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/messages') && resp.request().method() === 'POST' && resp.status() === 201,
        { timeout: 10000 }
      ),
      textarea.press('Enter'),
    ]);

    await page.reload();
    await expect(page.locator('text=Persist after reload')).toBeVisible({ timeout: 20000 });
  });

  test('should show initial message from conversation creation', async ({ page }) => {
    await setupConversation(page);
    await expect(page.locator('text=Setup message')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Messages - Edit', () => {
  test('should edit own message via context menu', async ({ page }) => {
    await setupConversation(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Original message text');
    await textarea.press('Enter');
    // Wait for textarea to clear (message sent successfully)
    await expect(textarea).toHaveValue('', { timeout: 8000 });
    // Use .last() because sidebar also shows last message preview (sidebar comes first in DOM)
    const message = page.locator('text=Original message text').last();
    await expect(message).toBeVisible({ timeout: 5000 });
    await message.click({ button: 'right' });

    await expect(page.getByText('Edit', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByText('Edit', { exact: true }).click();

    // Wait for edit mode to activate, then fill the edit input (skip search bar which is nth(0))
    await expect(page.locator('text=escape to cancel')).toBeVisible({ timeout: 3000 });
    const editInput = page.getByRole('textbox').nth(1);
    await editInput.fill('Edited message text');
    await editInput.press('Enter');

    await expect(page.locator('text=Edited message text').last()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Messages - Delete', () => {
  test('should delete own message via context menu', async ({ page }) => {
    await setupConversation(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Message to delete');
    await textarea.press('Enter');
    await expect(textarea).toHaveValue('', { timeout: 8000 });
    const message = page.locator('text=Message to delete').last();
    await expect(message).toBeVisible({ timeout: 5000 });
    await message.click({ button: 'right' });

    await expect(page.getByText('Delete', { exact: true })).toBeVisible({ timeout: 5000 });
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/messages/') && resp.request().method() === 'DELETE',
        { timeout: 5000 }
      ),
      page.getByText('Delete', { exact: true }).click(),
    ]);
    // Reload to verify the deletion persisted (sidebar also updates via fetchConversationsThunk)
    await page.reload();
    await expect(page.locator('text=Message to delete')).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Messages - Permissions', () => {
  test('should not show edit/delete on other user messages', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'From user1',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // user2 sends a message in a separate context
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    // Click on conversation in sidebar (client-side nav, no page reload)
    await expect(page2.locator(`text=${user1.firstName} ${user1.lastName}`).first()).toBeVisible({ timeout: 10000 });
    await page2.locator(`text=${user1.firstName} ${user1.lastName}`).first().click();
    const textarea2 = page2.locator('textarea');
    await expect(textarea2).toBeVisible({ timeout: 10000 });
    await textarea2.fill('Message from user2');
    await textarea2.press('Enter');
    await expect(textarea2).toHaveValue('', { timeout: 8000 });
    await ctx2.close();

    // user1 views and right-clicks user2's message
    await loginViaUI(page, user1.username, user1.password);
    // Click on conversation in sidebar (client-side nav)
    await expect(page.locator(`text=${user2.firstName} ${user2.lastName}`).first()).toBeVisible({ timeout: 10000 });
    await page.locator(`text=${user2.firstName} ${user2.lastName}`).first().click();
    const otherMessage = page.locator('text=Message from user2').last();
    await expect(otherMessage).toBeVisible({ timeout: 10000 });
    await otherMessage.click({ button: 'right' });

    await expect(page.getByText('Edit', { exact: true })).not.toBeVisible({ timeout: 3000 });
  });
});
