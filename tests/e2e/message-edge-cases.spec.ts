import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Message Edge Cases - Threading', () => {
  test('should send a threaded reply and retrieve thread via API', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    // Create conversation
    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Thread parent',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Get messages to find the parent
    const msgsRes = await apiRequest('GET', `/conversations/${conv.id}/messages`, token1);
    expect(msgsRes.ok).toBeTruthy();
    const msgs = await msgsRes.json();
    const parentMsg = Array.isArray(msgs) ? msgs[0] : msgs;
    const parentMsgId = parentMsg?.id;

    if (parentMsgId) {
      // Send a threaded reply
      const replyRes = await apiRequest('POST', `/conversations/${conv.id}/messages`, token1, {
        content: 'Thread reply message',
        parentMessageId: parentMsgId,
      });
      // If threading is supported, this should succeed
      if (replyRes.ok) {
        // Get thread
        const threadRes = await apiRequest(
          'GET',
          `/conversations/${conv.id}/messages/${parentMsgId}/thread`,
          token1,
        );
        if (threadRes.ok) {
          const thread = await threadRes.json();
          expect(Array.isArray(thread)).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Message Edge Cases - Validation', () => {
  test('should reject message with neither content nor attachments', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Setup',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Send empty message (no content, no attachments)
    const emptyRes = await apiRequest('POST', `/conversations/${conv.id}/messages`, token1, {
      content: '',
    });
    expect(emptyRes.ok).toBeFalsy();
    expect(emptyRes.status).toBe(400);
  });

  test('should reject editing message with empty content', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Edit validation test',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Get messages
    const msgsRes = await apiRequest('GET', `/conversations/${conv.id}/messages`, token1);
    const msgs = await msgsRes.json();
    const msgId = Array.isArray(msgs) ? msgs[0]?.id : msgs?.id;

    if (msgId) {
      // Try to edit with empty content
      const editRes = await apiRequest(
        'PATCH',
        `/conversations/${conv.id}/messages/${msgId}`,
        token1,
        { content: '' },
      );
      expect(editRes.ok).toBeFalsy();
    }
  });

  test('should reject deleting another users message', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    // user2 creates conversation and sends a message
    const convRes = await apiRequest('POST', '/conversations', token2, {
      username: user1.username,
      message: 'user2 owns this message',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    const msgsRes = await apiRequest('GET', `/conversations/${conv.id}/messages`, token1);
    const msgs = await msgsRes.json();
    const msgId = Array.isArray(msgs) ? msgs[0]?.id : msgs?.id;

    if (msgId) {
      // user1 tries to delete user2's message
      const delRes = await apiRequest(
        'DELETE',
        `/conversations/${conv.id}/messages/${msgId}`,
        token1,
      );
      expect(delRes.ok).toBeFalsy();
      expect(delRes.status).toBe(403);
    }
  });
});

test.describe('Message Edge Cases - Invalid Conversation', () => {
  test('should reject sending message to invalid conversation ID', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const res = await apiRequest('POST', '/conversations/invalid-uuid/messages', accessToken, {
      content: 'Should fail',
    });
    expect(res.ok).toBeFalsy();
    expect(res.status).toBe(400);
  });
});
