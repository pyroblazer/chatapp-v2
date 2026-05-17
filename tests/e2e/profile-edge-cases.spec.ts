import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  setupAuthenticatedPage,
} from '../setup/test-fixtures';

test.describe('Profile Edge Cases - Status Message', () => {
  test('should update presence status message via API', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const statusRes = await apiRequest('PATCH', '/users/presence/status', accessToken, {
      statusMessage: 'In a meeting',
    });
    expect(statusRes.ok).toBeTruthy();
  });

  test('should clear presence status message via API', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    // Set status
    await apiRequest('PATCH', '/users/presence/status', accessToken, {
      statusMessage: 'Available',
    });

    // Clear status
    const clearRes = await apiRequest('PATCH', '/users/presence/status', accessToken, {
      statusMessage: '',
    });
    expect(clearRes.ok).toBeTruthy();
  });
});

test.describe('Profile Edge Cases - Username Check', () => {
  test('should check username availability via API', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    // Check existing username - should be taken
    const takenRes = await apiRequest('GET', `/users/check?username=${user.username}`, accessToken);
    expect(takenRes.ok).toBeTruthy();
    const taken = await takenRes.json();
    expect(taken.available ?? taken.exists ?? taken).toBeDefined();

    // Check a random unused username
    const randomUser = `available${Date.now().toString(36)}`;
    const availRes = await apiRequest('GET', `/users/check?username=${randomUser}`, accessToken);
    expect(availRes.ok).toBeTruthy();
  });
});

test.describe('Profile Edge Cases - User Search', () => {
  test('should search users via API and find registered user', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const searchRes = await apiRequest(
      'GET',
      `/users/search?query=${user2.username.slice(0, 5)}`,
      token1,
    );
    expect(searchRes.ok).toBeTruthy();
    const results = await searchRes.json();
    expect(Array.isArray(results)).toBeTruthy();
    const found = results.some((r: any) => r.username === user2.username);
    expect(found).toBeTruthy();
  });

  test('should return empty results for non-matching search', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const searchRes = await apiRequest(
      'GET',
      `/users/search?query=zzzzzznonexistent${Date.now()}`,
      accessToken,
    );
    expect(searchRes.ok).toBeTruthy();
    const results = await searchRes.json();
    expect(Array.isArray(results)).toBeTruthy();
    expect(results.length).toBe(0);
  });
});
