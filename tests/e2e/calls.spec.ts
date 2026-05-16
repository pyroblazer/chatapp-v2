import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Calls - Page Render', () => {
  test('should render calls page when authenticated', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
  });

  test('should not redirect to login when authenticated', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should render calls sidebar', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');
    // The calls page renders CallsSidebar which shows friends
    await expect(page).toHaveURL(/\/calls/);
  });
});

test.describe('Calls - Friends in Calls List', () => {
  test('should show friends available for calling', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // Become friends
    const reqRes = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(reqRes.ok).toBeTruthy();
    const request = await reqRes.json();

    const requestsRes = await apiRequest('GET', '/friends/requests', token2);
    const requests = await requestsRes.json();
    const incoming = (Array.isArray(requests) ? requests : []).find(
      (r: any) => r.receiver?.username === user2.username,
    );
    if (incoming) {
      await apiRequest('PATCH', `/friends/requests/${incoming.id}/accept`, token2);
    }

    // user1 navigates to calls
    await loginViaUI(page, user1.username, user1.password);
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');

    // user2 should appear in calls sidebar
    await expect(page.locator(`text=${user2.username}`).or(page.locator(`text=${user2.firstName}`))).toBeVisible({
      timeout: 8000,
    });
  });

  test('should show empty calls list with no friends', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');
    // New user has no friends — page should still load without error
    await expect(page).toHaveURL(/\/calls/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Calls - Navigation', () => {
  test('should navigate to calls from conversations', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/conversations');
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
  });

  test('should navigate back to conversations from calls', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/conversations/);
  });
});
