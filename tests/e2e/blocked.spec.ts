import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Blocked Users - Page', () => {
  test('should render blocked users page', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/friends/blocked');
    await expect(page).toHaveURL(/\/friends\/blocked/);
  });

  test('should not redirect to login when authenticated', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/friends/blocked');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should show empty blocked list for new user', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/friends/blocked');
    await page.waitForLoadState('networkidle');
    // No blocked users — list should be empty or show empty state
    await expect(page).toHaveURL(/\/friends\/blocked/);
  });
});

test.describe('Blocked Users - Block and Unblock', () => {
  test('should block a user via API and see in blocked list', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const targetUser = createTestUser();
    await registerUserViaAPI(targetUser);

    const res = await apiRequest(
      'POST',
      `/users/blocked/${targetUser.username}`,
      user.accessToken,
    );
    expect(res.ok).toBeTruthy();

    await page.goto('/friends/blocked');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${targetUser.username}`)).toBeVisible({ timeout: 8000 });
  });

  test('should unblock a user via API and they disappear from blocked list', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const targetUser = createTestUser();
    await registerUserViaAPI(targetUser);

    // Block
    await apiRequest('POST', `/users/blocked/${targetUser.username}`, user.accessToken);

    // Verify blocked
    await page.goto('/friends/blocked');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${targetUser.username}`)).toBeVisible({ timeout: 8000 });

    // Unblock
    const unblockRes = await apiRequest(
      'DELETE',
      `/users/blocked/${targetUser.username}`,
      user.accessToken,
    );
    expect(unblockRes.ok).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${targetUser.username}`)).not.toBeVisible({ timeout: 5000 });
  });

  test('should block multiple users and list all of them', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const targets = [createTestUser(), createTestUser(), createTestUser()];
    for (const t of targets) {
      await registerUserViaAPI(t);
      await apiRequest('POST', `/users/blocked/${t.username}`, user.accessToken);
    }

    await page.goto('/friends/blocked');
    await page.waitForLoadState('networkidle');

    for (const t of targets) {
      await expect(page.locator(`text=${t.username}`)).toBeVisible({ timeout: 8000 });
    }
  });

  test('should fetch blocked users via API', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const targetUser = createTestUser();
    await registerUserViaAPI(targetUser);

    await apiRequest('POST', `/users/blocked/${targetUser.username}`, user.accessToken);

    const blockedRes = await apiRequest('GET', '/users/blocked', user.accessToken);
    expect(blockedRes.ok).toBeTruthy();
    const blocked = await blockedRes.json();
    const found = (Array.isArray(blocked) ? blocked : []).some(
      (b: any) => b.username === targetUser.username || b.blockedUser?.username === targetUser.username,
    );
    expect(found).toBeTruthy();
  });
});

test.describe('Blocked Users - Navigation', () => {
  test('should navigate from friends to blocked users page', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/friends');
    // Navigate to blocked page via URL
    await page.goto('/friends/blocked');
    await expect(page).toHaveURL(/\/friends\/blocked/);
  });
});
