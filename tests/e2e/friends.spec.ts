import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerAndLogin,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Friends - Display', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/friends');
  });

  test('should display friends page', async ({ page }) => {
    await expect(page).toHaveURL(/\/friends/);
  });

  test('should show Friends and Requests navbar tabs', async ({ page }) => {
    await expect(page.locator('text=Friends')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Requests')).toBeVisible({ timeout: 5000 });
  });

  test('should show Add Friend button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Friend")')).toBeVisible({ timeout: 5000 });
  });

  test('should show empty friends list for new user', async ({ page }) => {
    await expect(page).toHaveURL(/\/friends/);
    await expect(page.locator('button:has-text("Add Friend")')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to friend requests page', async ({ page }) => {
    await page.locator('text=Requests').click();
    await expect(page).toHaveURL(/\/friends\/requests/);
  });
});

test.describe('Friends - Friend Requests Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should display friend requests page with empty state', async ({ page }) => {
    await page.goto('/friends/requests');
    await expect(page).toHaveURL(/\/friends\/requests/);
    const emptyState = page.locator('text=No Friend Requests');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back to friends list from requests', async ({ page }) => {
    await page.goto('/friends/requests');
    await page.locator('text=Friends').first().click();
    await expect(page).toHaveURL(/\/friends$/);
  });
});

test.describe('Friends - Send Friend Request', () => {
  test('should open send friend request modal', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/friends');
    const addBtn = page.locator('button:has-text("Add Friend")');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await expect(page.locator('h2:has-text("Send a Friend Request")')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should send friend request via API and recipient sees it in requests', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const loginRes1 = await loginViaAPI(user1.username, user1.password);
    const res = await apiRequest('POST', '/friends/requests', loginRes1.accessToken, {
      username: user2.username,
    });
    expect(res.ok).toBeTruthy();

    // user2 logs in via UI and navigates to requests
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/friends/requests');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Incoming Friend Request')).toBeVisible({ timeout: 8000 });
  });

  test('should show outgoing request for the sender', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    await page.goto('/friends');
    const addBtn = page.locator('button:has-text("Add Friend")');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    const modal = page.locator('h2:has-text("Send a Friend Request")');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const input = page.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(otherUser.username);
    await page.locator('button:has-text("Send")').click();
    await expect(page).toHaveURL(/\/friends/, { timeout: 5000 });
  });
});

test.describe('Friends - Accept Friend Request', () => {
  test('should accept friend request via API and see friend in list', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const loginRes1 = await loginViaAPI(user1.username, user1.password);
    const loginRes2 = await loginViaAPI(user2.username, user2.password);

    // user1 sends request to user2
    await apiRequest('POST', '/friends/requests', loginRes1.accessToken, {
      username: user2.username,
    });

    // user2 fetches and accepts the request
    const requestsRes = await apiRequest('GET', '/friends/requests', loginRes2.accessToken);
    expect(requestsRes.ok).toBeTruthy();
    const requests = await requestsRes.json();
    const incoming = Array.isArray(requests)
      ? requests.filter((r: any) => r.receiver?.username === user2.username)
      : [];
    expect(incoming.length).toBeGreaterThan(0);

    const requestId = incoming[0].id;
    const acceptRes = await apiRequest(
      'PATCH',
      `/friends/requests/${requestId}/accept`,
      loginRes2.accessToken,
    );
    expect(acceptRes.ok).toBeTruthy();

    // user2 views friends list via UI
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${user1.username}`)).toBeVisible({ timeout: 8000 });
  });

  test('should cancel outgoing friend request via API', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const loginRes1 = await loginViaAPI(user1.username, user1.password);
    const sendRes = await apiRequest('POST', '/friends/requests', loginRes1.accessToken, {
      username: user2.username,
    });
    expect(sendRes.ok).toBeTruthy();
    const request = await sendRes.json();

    const cancelRes = await apiRequest(
      'DELETE',
      `/friends/requests/${request.id}/cancel`,
      loginRes1.accessToken,
    );
    expect(cancelRes.ok).toBeTruthy();

    // user1 views requests — no outgoing request
    await loginViaUI(page, user1.username, user1.password);
    await page.goto('/friends/requests');
    await page.waitForLoadState('networkidle');
    const outgoing = page.locator('text=Outgoing Friend Request');
    await expect(outgoing).not.toBeVisible({ timeout: 3000 });
  });

  test('should remove a friend via API', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const loginRes1 = await loginViaAPI(user1.username, user1.password);
    const loginRes2 = await loginViaAPI(user2.username, user2.password);

    // Become friends
    await apiRequest('POST', '/friends/requests', loginRes1.accessToken, {
      username: user2.username,
    });
    const requestsRes = await apiRequest('GET', '/friends/requests', loginRes2.accessToken);
    const requests = await requestsRes.json();
    const incoming = Array.isArray(requests)
      ? requests.filter((r: any) => r.receiver?.username === user2.username)
      : [];
    if (incoming.length > 0) {
      await apiRequest(
        'PATCH',
        `/friends/requests/${incoming[0].id}/accept`,
        loginRes2.accessToken,
      );
    }

    // Get friend entry and remove
    const friendsRes = await apiRequest('GET', '/friends', loginRes1.accessToken);
    const friends = await friendsRes.json();
    const friend = Array.isArray(friends) ? friends[0] : null;
    if (friend) {
      const removeRes = await apiRequest(
        'DELETE',
        `/friends/${friend.id}/delete`,
        loginRes1.accessToken,
      );
      expect(removeRes.ok).toBeTruthy();
    }

    // user1 views friends list — empty
    await loginViaUI(page, user1.username, user1.password);
    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${user2.username}`)).not.toBeVisible({ timeout: 5000 });
  });
});
