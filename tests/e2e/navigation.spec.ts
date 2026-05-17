import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../setup/test-fixtures';

test.describe('Navigation - Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should show conversations page by default after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/conversations/);
  });

  test('should navigate to groups page', async ({ page }) => {
    await page.goto('/groups');
    await expect(page).toHaveURL(/\/groups/);
  });

  test('should navigate to friends page', async ({ page }) => {
    await page.goto('/friends');
    await expect(page).toHaveURL(/\/friends/);
  });

  test('should navigate to calls page', async ({ page }) => {
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should redirect unknown routes to conversations', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await expect(page).toHaveURL(/\/conversations/);
  });
});

test.describe('Navigation - Page transitions', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should navigate between all main pages', async ({ page }) => {
    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });

    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/groups/, { timeout: 10000 });

    await page.goto('/friends');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/friends/, { timeout: 10000 });

    await page.goto('/calls');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/calls/, { timeout: 10000 });

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/settings/, { timeout: 10000 });

    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
  });

  test('should use browser back/forward correctly', async ({ page }) => {
    await page.goto('/conversations');
    await page.goto('/friends');
    await page.goto('/settings');
    await page.goBack();
    await expect(page).toHaveURL(/\/friends/);
    await page.goBack();
    await expect(page).toHaveURL(/\/conversations/);
    await page.goForward();
    await expect(page).toHaveURL(/\/friends/);
  });
});

test.describe('Navigation - Nested routes', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should navigate to friend requests sub-page', async ({ page }) => {
    await page.goto('/friends/requests');
    await expect(page).toHaveURL(/\/friends\/requests/);
  });

  test('should navigate to settings profile sub-page', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test('should navigate to settings appearance sub-page', async ({ page }) => {
    await page.goto('/settings/appearance');
    await expect(page).toHaveURL(/\/settings\/appearance/);
  });
});
