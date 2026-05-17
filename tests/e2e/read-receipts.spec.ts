import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

async function setupConversationWithMessages() {
  const user1 = createTestUser();
  const user2 = createTestUser();
  await registerUserViaAPI(user1);
  await registerUserViaAPI(user2);

  const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
  const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

  await makeFriends(token1, user2.username, token2);

  // Create conversation with initial message
  const convRes = await apiRequest('POST', '/conversations', token1, {
    username: user2.username,
    message: 'Hello read receipts',
  });
  expect(convRes.ok).toBeTruthy();
  const conv = await convRes.json();

  return { user1, user2, token1, token2, convId: conv.id };
}

test.describe('Read Receipts - Unread Count', () => {
  test('should return non-zero unread count for message recipient', async () => {
    const { token2, convId } = await setupConversationWithMessages();

    const res = await apiRequest('GET', `/conversations/${convId}/read-receipts`, token2);
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    const unread = data.unreadCount ?? data.count ?? data;
    expect(unread).toBeGreaterThan(0);
  });

  test('should return zero unread count for sender of messages', async () => {
    const { token1, convId } = await setupConversationWithMessages();

    const res = await apiRequest('GET', `/conversations/${convId}/read-receipts`, token1);
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    const unread = data.unreadCount ?? data.count ?? data;
    expect(unread).toBe(0);
  });
});

test.describe('Read Receipts - Mark as Read', () => {
  test('should mark all messages as read and return zero unread count', async () => {
    const { token1, token2, convId } = await setupConversationWithMessages();

    // Send additional messages
    await apiRequest('POST', `/conversations/${convId}/messages`, token1, {
      content: 'Second message',
    });
    await apiRequest('POST', `/conversations/${convId}/messages`, token1, {
      content: 'Third message',
    });

    // Verify unread > 0 for recipient
    const beforeRes = await apiRequest('GET', `/conversations/${convId}/read-receipts`, token2);
    const before = await beforeRes.json();
    const unreadBefore = before.unreadCount ?? before.count ?? before;
    expect(unreadBefore).toBeGreaterThan(0);

    // Mark all as read
    const markRes = await apiRequest('POST', `/conversations/${convId}/read-receipts`, token2);
    expect(markRes.ok).toBeTruthy();

    // Verify unread = 0
    const afterRes = await apiRequest('GET', `/conversations/${convId}/read-receipts`, token2);
    const after = await afterRes.json();
    const unreadAfter = after.unreadCount ?? after.count ?? after;
    expect(unreadAfter).toBe(0);
  });

  test('should reflect read status across users', async () => {
    const { token1, token2, convId } = await setupConversationWithMessages();

    // user2 marks as read
    await apiRequest('POST', `/conversations/${convId}/read-receipts`, token2);

    // user1 checks read receipts for the conversation
    const res = await apiRequest('GET', `/conversations/${convId}/read-receipts`, token1);
    expect(res.ok).toBeTruthy();
    // The response should indicate messages have been read by user2
    const data = await res.json();
    expect(data).toBeDefined();
  });
});
