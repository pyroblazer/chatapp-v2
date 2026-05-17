import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Conversation Edge Cases - Auto-create', () => {
  test('should auto-create conversation via exists endpoint', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    // Get user2's ID via search or friends list
    const friendsRes = await apiRequest('GET', '/friends', token1);
    const friends = await friendsRes.json();
    const friendList = Array.isArray(friends) ? friends : friends.friends ?? [];
    const friend = friendList.find(
      (f: any) => f.username === user2.username || f.user?.username === user2.username,
    );
    const recipientId = friend?.id ?? friend?.user?.id;

    if (recipientId) {
      const existsRes = await apiRequest(
        'GET',
        `/exists/conversations/${recipientId}`,
        token1,
      );
      expect(existsRes.ok).toBeTruthy();
      const data = await existsRes.json();
      expect(data.id).toBeDefined();
    }
  });

  test('should return existing conversation from exists endpoint (idempotent)', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    // Create conversation normally
    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Pre-created',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Get friend ID
    const friendsRes = await apiRequest('GET', '/friends', token1);
    const friends = await friendsRes.json();
    const friendList = Array.isArray(friends) ? friends : friends.friends ?? [];
    const friend = friendList.find(
      (f: any) => f.username === user2.username || f.user?.username === user2.username,
    );
    const recipientId = friend?.id ?? friend?.user?.id;

    if (recipientId) {
      // Hit exists endpoint - should return the same conversation
      const existsRes = await apiRequest('GET', `/exists/conversations/${recipientId}`, token1);
      expect(existsRes.ok).toBeTruthy();
      const data = await existsRes.json();
      expect(data.id).toBe(conv.id);
    }
  });
});

test.describe('Conversation Edge Cases - Non-friend', () => {
  test('should reject creating conversation with non-friend', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    // Attempt to create conversation without being friends
    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Should fail',
    });
    expect(convRes.ok).toBeFalsy();
  });
});
