import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Global Search - Messages', () => {
  test('should search messages by content and return matching results', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const uniqueContent = `UniqueSearchMsg${Date.now().toString(36)}`;
    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: uniqueContent,
    });
    expect(convRes.ok).toBeTruthy();

    const searchRes = await apiRequest('GET', `/search?q=${uniqueContent}&type=messages`, token1);
    expect(searchRes.ok).toBeTruthy();
    const data = await searchRes.json();
    const results = Array.isArray(data) ? data : data.results ?? data.messages ?? [];
    expect(results.length).toBeGreaterThan(0);
    const found = results.some(
      (r: any) => r.content === uniqueContent || r.text === uniqueContent || r.body === uniqueContent,
    );
    expect(found).toBeTruthy();
  });
});

test.describe('Global Search - Users', () => {
  test('should search users by username', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser({ username: `searchuser${Date.now().toString(36)}` });
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const searchRes = await apiRequest('GET', `/search?q=${user2.username}&type=users`, token1);
    expect(searchRes.ok).toBeTruthy();
    const data = await searchRes.json();
    const results = Array.isArray(data) ? data : data.results ?? data.users ?? [];
    expect(results.length).toBeGreaterThan(0);
    const found = results.some((r: any) => r.username === user2.username);
    expect(found).toBeTruthy();
  });

  test('should search users via user search endpoint used in modals', async () => {
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
});

test.describe('Global Search - Groups', () => {
  test('should search groups by title', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const uniqueTitle = `SearchGroup${Date.now().toString(36)}`;
    const groupRes = await apiRequest('POST', '/groups', accessToken, {
      title: uniqueTitle,
      users: [],
    });
    expect(groupRes.ok).toBeTruthy();

    const searchRes = await apiRequest('GET', `/search?q=${uniqueTitle}&type=groups`, accessToken);
    expect(searchRes.ok).toBeTruthy();
    const data = await searchRes.json();
    const results = Array.isArray(data) ? data : data.results ?? data.groups ?? [];
    expect(results.length).toBeGreaterThan(0);
    const found = results.some((r: any) => r.title === uniqueTitle || r.name === uniqueTitle);
    expect(found).toBeTruthy();
  });
});
