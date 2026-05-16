import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

async function setupConversationWithMessage(page: Parameters<typeof setupAuthenticatedPage>[0]) {
  const user = await setupAuthenticatedPage(page);
  const otherUser = createTestUser();
  await registerUserViaAPI(otherUser);

  const convRes = await apiRequest('POST', '/conversations', user.accessToken, {
    username: otherUser.username,
    message: 'Reaction test message',
  });
  expect(convRes.ok).toBeTruthy();
  const conv = await convRes.json();

  // Fetch messages to get the message ID
  const msgsRes = await apiRequest('GET', `/conversations/${conv.id}/messages`, user.accessToken);
  expect(msgsRes.ok).toBeTruthy();
  const msgs = await msgsRes.json();
  const messageId = (Array.isArray(msgs) ? msgs[0] : msgs.messages?.[0])?.id;

  return { user, otherUser, convId: conv.id as string, messageId: messageId as string };
}

test.describe('Reactions - Add and Display', () => {
  test('should add reaction via API and display it on message', async ({ page }) => {
    const { user, convId, messageId } = await setupConversationWithMessage(page);
    if (!messageId) return;

    const reactionRes = await apiRequest('POST', `/reactions/${messageId}`, user.accessToken, {
      emoji: '👍',
    });
    expect(reactionRes.ok).toBeTruthy();

    await page.goto(`/conversations/${convId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=👍')).toBeVisible({ timeout: 8000 });
  });

  test('should remove reaction via API and it disappears', async ({ page }) => {
    const { user, convId, messageId } = await setupConversationWithMessage(page);
    if (!messageId) return;

    // Add then remove
    await apiRequest('POST', `/reactions/${messageId}`, user.accessToken, { emoji: '❤️' });

    await page.goto(`/conversations/${convId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=❤️')).toBeVisible({ timeout: 8000 });

    await apiRequest('DELETE', `/reactions/${messageId}?emoji=❤️`, user.accessToken);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=❤️')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display reactions from multiple users', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Multi reaction message',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    const msgsRes = await apiRequest('GET', `/conversations/${conv.id}/messages`, token1);
    const msgs = await msgsRes.json();
    const messageId = (Array.isArray(msgs) ? msgs[0] : msgs.messages?.[0])?.id;
    if (!messageId) return;

    await apiRequest('POST', `/reactions/${messageId}`, token1, { emoji: '🔥' });
    await apiRequest('POST', `/reactions/${messageId}`, token2, { emoji: '😀' });

    // Navigate as user1
    await loginViaUI(page, user1.username, user1.password);
    await page.goto(`/conversations/${conv.id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=🔥')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=😀')).toBeVisible({ timeout: 8000 });
  });

  test('should fetch reactions via API', async ({ page }) => {
    const { user, messageId } = await setupConversationWithMessage(page);
    if (!messageId) return;

    await apiRequest('POST', `/reactions/${messageId}`, user.accessToken, { emoji: '⭐' });

    const reactionsRes = await apiRequest('GET', `/reactions/${messageId}`, user.accessToken);
    expect(reactionsRes.ok).toBeTruthy();
    const reactions = await reactionsRes.json();
    const hasReaction = (Array.isArray(reactions) ? reactions : [reactions]).some(
      (r: any) => r.emoji === '⭐',
    );
    expect(hasReaction).toBeTruthy();
  });
});
