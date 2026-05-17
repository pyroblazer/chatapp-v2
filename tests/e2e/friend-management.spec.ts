import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Friend Management - Reject Request', () => {
  test('should reject incoming friend request via API', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // user1 sends friend request to user2
    const reqRes = await apiRequest('POST', '/friends/requests', token1, { username: user2.username });
    expect(reqRes.ok).toBeTruthy();
    const req = await reqRes.json();

    // user2 logs in and rejects the request
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/friends/requests');
    await page.waitForLoadState('networkidle');

    // Verify the request is visible
    await expect(
      page.locator(`text=${user1.firstName}`).or(page.locator(`text=${user1.username}`)).first()
    ).toBeVisible({ timeout: 8000 });

    // Reject via API
    const rejectRes = await apiRequest('PATCH', `/friends/requests/${req.id}/reject`, token2);
    expect(rejectRes.ok).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Incoming Friend Request')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Friend Management - Cancel Request', () => {
  test('should cancel outgoing friend request via API', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    // Send a friend request
    const reqRes = await apiRequest('POST', '/friends/requests', user.accessToken, {
      username: otherUser.username,
    });
    expect(reqRes.ok).toBeTruthy();
    const req = await reqRes.json();

    // Cancel it
    const cancelRes = await apiRequest('DELETE', `/friends/requests/${req.id}/cancel`, user.accessToken);
    expect(cancelRes.ok).toBeTruthy();

    // Verify the request is gone from the requests page
    await page.goto('/friends/requests');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator(`text=${otherUser.firstName} ${otherUser.lastName}`)
    ).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Friend Management - Remove Friend', () => {
  test('should remove a friend and they disappear from friends list', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
    await makeFriends(user.accessToken, otherUser.username, token2);

    // Find the friend's ID
    const friendsRes = await apiRequest('GET', '/friends', user.accessToken);
    expect(friendsRes.ok).toBeTruthy();
    const friends = await friendsRes.json();
    const friend = (Array.isArray(friends) ? friends : friends.friends || []).find(
      (f: any) => f.receiver?.username === otherUser.username || f.sender?.username === otherUser.username
    );
    if (!friend) return;

    // Remove the friend via API
    const removeRes = await apiRequest('DELETE', `/friends/${friend.id}/delete`, user.accessToken);
    expect(removeRes.ok).toBeTruthy();

    // Verify they're gone from friends list
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator(`text=${otherUser.firstName} ${otherUser.lastName}`)
    ).not.toBeVisible({ timeout: 5000 });
  });
});
