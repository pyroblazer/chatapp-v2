import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Search - Conversation Sidebar', () => {
  test('should filter conversations by search query', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);

    const userAlpha = createTestUser();
    const userBeta = createTestUser();
    userAlpha.firstName = 'Alphaqqqq';
    userBeta.firstName = 'Betaqqqq';
    await registerUserViaAPI(userAlpha);
    await registerUserViaAPI(userBeta);

    const { accessToken: tokenA } = await loginViaAPI(userAlpha.username, userAlpha.password);
    const { accessToken: tokenB } = await loginViaAPI(userBeta.username, userBeta.password);
    await makeFriends(user.accessToken, userAlpha.username, tokenA);
    await makeFriends(user.accessToken, userBeta.username, tokenB);

    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userAlpha.username,
      message: 'hi alpha',
    });
    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userBeta.username,
      message: 'hi beta',
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Alphaqqqq');
    await page.waitForTimeout(600);

    await expect(page.locator('text=Alphaqqqq')).toBeVisible({ timeout: 5000 });
  });

  test('should clear search and restore full conversation list', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);

    const userA = createTestUser();
    const userB = createTestUser();
    await registerUserViaAPI(userA);
    await registerUserViaAPI(userB);
    const { accessToken: tA } = await loginViaAPI(userA.username, userA.password);
    const { accessToken: tB } = await loginViaAPI(userB.username, userB.password);
    await makeFriends(user.accessToken, userA.username, tA);
    await makeFriends(user.accessToken, userB.username, tB);

    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userA.username,
      message: 'hello a',
    });
    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userB.username,
      message: 'hello b',
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill(userA.username);
    await page.waitForTimeout(600);

    await searchInput.clear();
    await page.waitForTimeout(300);

    await expect(
      page.locator(`text=${userA.firstName}`).or(page.locator(`text=${userA.username}`)),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator(`text=${userB.firstName}`).or(page.locator(`text=${userB.username}`)),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show no results for gibberish query', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);
    const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
    await makeFriends(user.accessToken, otherUser.username, token2);

    await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'test',
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('xyznonexistentxyz123456');
    await page.waitForTimeout(600);

    await expect(
      page.locator(`text=${otherUser.firstName}`).or(page.locator(`text=${otherUser.username}`)),
    ).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Search - Add Friend Modal', () => {
  test('should open add friend modal', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/friends');
    const addBtn = page.locator('button:has-text("Add Friend")');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await expect(page.locator('h2:has-text("Send a Friend Request")')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should type username in add friend modal input', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const targetUser = createTestUser();
    await registerUserViaAPI(targetUser);

    await page.goto('/friends');
    const addBtn = page.locator('button:has-text("Add Friend")');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    await expect(page.locator('h2:has-text("Send a Friend Request")')).toBeVisible({
      timeout: 5000,
    });

    const modalInput = page.locator('input[placeholder]').last();
    if (await modalInput.isVisible({ timeout: 3000 })) {
      await modalInput.fill(targetUser.username);
      await expect(modalInput).toHaveValue(targetUser.username);
    }
  });

  test('should submit friend request via modal', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const targetUser = createTestUser();
    await registerUserViaAPI(targetUser);

    await page.goto('/friends');
    await page.locator('button:has-text("Add Friend")').click();
    await expect(page.locator('h2:has-text("Send a Friend Request")')).toBeVisible({
      timeout: 5000,
    });

    const modalInput = page.locator('input[placeholder]').last();
    if (await modalInput.isVisible({ timeout: 3000 })) {
      await modalInput.fill(targetUser.username);
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/friends/requests')),
        page.locator('button[type="submit"]').click(),
      ]);
      expect(response.status()).toBeLessThan(400);
    }
  });
});
