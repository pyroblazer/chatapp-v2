import { Page, BrowserContext } from '@playwright/test';

export async function loginAsUser(page: Page, username: string) {
  await page.goto('/login');

  // Fill in login form
  await page.locator('input[type="email"]').fill(`${username}@test.com`);
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();

  // Wait for navigation to complete
  await page.waitForURL('/conversations', { timeout: 5000 });
}

export async function setupConversation(context: BrowserContext, id: string, unreadCount: number) {
  const page = await context.newPage();
  await page.goto('/conversations');
  await page.evaluate(
    ({ id, count }) => window.__SET_UNREAD_COUNT__(id, count),
    { id, count: unreadCount }
  );
}

export async function waitForBadgeUpdate(page: Page, expectedCount: string) {
  await page.waitForSelector(`[data-testid="conversations-nav-icon"] .icon-badge`, {
    state: 'visible',
    timeout: 5000
  });
  await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
    .toHaveText(expectedCount);
}

export async function createTestConversation(page: Page, id: string, recipientName: string) {
  await page.evaluate((convId) => {
    window.__MOCKET_SOCKET_EMIT__('onConversation', {
      id: convId,
      recipient: { firstName: recipientName, lastName: 'Test' },
      lastMessageSent: null,
      createdAt: new Date().toISOString()
    });
  }, id);
}

export async function simulateIncomingMessage(page: Page, conversationId: string, content: string) {
  await page.evaluate(({ convId, msgContent }) => {
    window.__MOCKET_SOCKET_EMIT__('onMessage', {
      conversation: { id: convId },
      message: {
        id: `msg-${Date.now()}`,
        content: msgContent,
        createdAt: new Date().toISOString(),
        author: { id: 'other-user', firstName: 'Other', lastName: 'User' }
      }
    });
  }, { conversationId: conversationId, content });
}

export async function getUnreadCount(page: Page, conversationId: string): Promise<number> {
  const count = await page.evaluate((convId) => {
    return window.__GET_UNREAD_COUNT__(convId) || 0;
  }, conversationId);
  return count;
}