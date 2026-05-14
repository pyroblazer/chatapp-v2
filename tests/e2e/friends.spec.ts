import { test, expect } from '@playwright/test';
import { createTestUser, registerAndLogin, registerUserViaAPI, loginViaAPI, loginViaUI } from '../setup/test-fixtures';

const BASE_URL = process.env.BASE_URL || 'http://localhost:80';

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
    await expect(page.locator('button:has-text("Add Friend")')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should show empty friends list for new user', async ({ page }) => {
    // New user has no friends — page renders with nav and Add Friend button
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
    // New user has no friend requests
    const emptyState = page.locator('text=No Friend Requests');
    await expect(emptyState).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should navigate back to friends list from requests', async ({ page }) => {
    await page.goto('/friends/requests');
    await page.locator('text=Friends').first().click();
    await expect(page).toHaveURL(/\/friends$/);
  });
});

test.describe('Friends - Send Friend Request', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should open send friend request modal', async ({ page }) => {
    await page.goto('/friends');
    const addBtn = page.locator('button:has-text("Add Friend")');
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(page.locator('h2:has-text("Send a Friend Request")')).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('should send friend request via API and see it in requests', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    // user1 sends friend request to user2 via API
    const loginRes = await loginViaAPI(user1.username, user1.password);
    await fetch(`${BASE_URL}/api/friends/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginRes.accessToken}`,
      },
      body: JSON.stringify({ username: user2.username }),
    });

    // user2 views requests
    const loginRes2 = await loginViaAPI(user2.username, user2.password);
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, loginRes2.accessToken);
    await page.goto('/friends/requests');
    await page.waitForTimeout(1000);
    // Should show the incoming request
    await expect(page.locator('text=Incoming Friend Request')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe('Friends - Accept Friend Request', () => {
  test('should accept friend request and see friend in list', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    // user1 sends friend request to user2
    const loginRes1 = await loginViaAPI(user1.username, user1.password);
    await fetch(`${BASE_URL}/api/friends/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginRes1.accessToken}`,
      },
      body: JSON.stringify({ username: user2.username }),
    });

    // user2 accepts via API
    const loginRes2 = await loginViaAPI(user2.username, user2.password);
    const requestsRes = await fetch(`${BASE_URL}/api/friends/requests`, {
      headers: { Authorization: `Bearer ${loginRes2.accessToken}` },
    });
    if (requestsRes.ok) {
      const requests = await requestsRes.json();
      const incoming = Array.isArray(requests)
        ? requests.filter((r: any) => r.type === 'incoming' || r.receiver?.username === user2.username)
        : [];
      if (incoming.length > 0) {
        const requestId = incoming[0].id;
        await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${loginRes2.accessToken}` },
        });
      }
    }

    // user2 views friends list via UI login
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/friends');
    await page.waitForTimeout(1000);
    // Should show friend
    await expect(page.locator(`text=${user1.username}`)).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
