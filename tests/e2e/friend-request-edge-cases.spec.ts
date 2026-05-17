import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Friend Request Edge Cases - Validation', () => {
  test('should reject friend request to non-existent username', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const res = await apiRequest('POST', '/friends/requests', accessToken, {
      username: `nonexistent${Date.now()}`,
    });
    expect(res.ok).toBeFalsy();
    expect(res.status).toBe(400);
  });

  test('should reject friend request to yourself', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const res = await apiRequest('POST', '/friends/requests', accessToken, {
      username: user.username,
    });
    expect(res.ok).toBeFalsy();
    expect(res.status).toBe(400);
  });

  test('should reject duplicate pending friend request', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    // Send first request
    const res1 = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(res1.ok).toBeTruthy();

    // Send duplicate request
    const res2 = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(res2.ok).toBeFalsy();
    expect(res2.status).toBe(409);
  });

  test('should reject friend request to already-friend', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    // Try sending another request to already-friend
    const res = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(res.ok).toBeFalsy();
  });
});

test.describe('Friend Request Edge Cases - Accept/Reject Guards', () => {
  test('should reject accepting someone elses friend request', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    const user3 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user1.password);
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);

    // user1 sends request to user2
    const reqRes = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(reqRes.ok).toBeTruthy();
    const req = await reqRes.json();

    // user3 tries to accept user1->user2 request
    const acceptRes = await apiRequest('PATCH', `/friends/requests/${req.id}/accept`, token3);
    expect(acceptRes.ok).toBeFalsy();
  });

  test('should reject cancelling someone elses friend request', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // user1 sends request to user2
    const reqRes = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(reqRes.ok).toBeTruthy();
    const req = await reqRes.json();

    // user2 tries to cancel (they are the receiver, not sender)
    const cancelRes = await apiRequest('DELETE', `/friends/requests/${req.id}/cancel`, token2);
    expect(cancelRes.ok).toBeFalsy();
  });

  test('should reject accepting already-accepted friend request', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // user1 sends, user2 accepts
    const reqRes = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    const req = await reqRes.json();

    await apiRequest('PATCH', `/friends/requests/${req.id}/accept`, token2);

    // user2 tries to accept again
    const secondAccept = await apiRequest('PATCH', `/friends/requests/${req.id}/accept`, token2);
    expect(secondAccept.ok).toBeFalsy();
  });
});
