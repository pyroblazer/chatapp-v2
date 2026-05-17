import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Notifications - List and Display', () => {
  test('should fetch notifications via API and receive paginated results', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // Trigger a notification by sending a friend request
    await apiRequest('POST', '/friends/requests', token2, { username: user1.username });

    // Small delay for async notification creation
    await new Promise((r) => setTimeout(r, 1000));

    const res = await apiRequest('GET', '/notifications', token1);
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('should return zero unread count for new user with no notifications', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const res = await apiRequest('GET', '/notifications/unread-count', accessToken);
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    expect(data.count ?? data.unreadCount ?? data).toBe(0);
  });

  test('should show non-zero unread count after triggering a notification', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    await apiRequest('POST', '/friends/requests', token2, { username: user1.username });
    await new Promise((r) => setTimeout(r, 1000));

    const res = await apiRequest('GET', '/notifications/unread-count', token1);
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    const count = data.count ?? data.unreadCount ?? data;
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Notifications - Mark as Read', () => {
  test('should mark a single notification as read', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // Create a notification
    await apiRequest('POST', '/friends/requests', token2, { username: user1.username });
    await new Promise((r) => setTimeout(r, 1000));

    // Get notifications to find the ID
    const listRes = await apiRequest('GET', '/notifications', token1);
    const notifications = await listRes.json();
    expect(notifications.length).toBeGreaterThan(0);

    const notificationId = notifications[0].id;

    // Mark as read
    const readRes = await apiRequest('PATCH', `/notifications/${notificationId}/read`, token1);
    expect(readRes.ok).toBeTruthy();

    // Verify unread count decreased
    const countRes = await apiRequest('GET', '/notifications/unread-count', token1);
    const data = await countRes.json();
    const count = data.count ?? data.unreadCount ?? data;
    expect(count).toBe(0);
  });

  test('should mark all notifications as read', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    const user3 = createTestUser();
    const user4 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);
    await registerUserViaAPI(user4);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);
    const { accessToken: token4 } = await loginViaAPI(user4.username, user4.password);

    // Create multiple notifications
    await apiRequest('POST', '/friends/requests', token2, { username: user1.username });
    await apiRequest('POST', '/friends/requests', token3, { username: user1.username });
    await apiRequest('POST', '/friends/requests', token4, { username: user1.username });
    await new Promise((r) => setTimeout(r, 1500));

    // Mark all as read
    const readAllRes = await apiRequest('PATCH', '/notifications/read-all', token1);
    expect(readAllRes.ok).toBeTruthy();

    // Verify unread count is zero
    const countRes = await apiRequest('GET', '/notifications/unread-count', token1);
    const data = await countRes.json();
    const count = data.count ?? data.unreadCount ?? data;
    expect(count).toBe(0);
  });
});
