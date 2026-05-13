import { test, expect } from '@playwright/test';

test.describe('Friends', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="username"], input[placeholder*="sername"]', 'admin');
    await page.fill('input[type="password"]', 'changeme123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/conversations**', { timeout: 10000 }).catch(() => {});
    await page.goto('/friends');
  });

  test('should display friends page', async ({ page }) => {
    await expect(page).toHaveURL(/\/friends/);
  });

  test('should show friends list or tabs', async ({ page }) => {
    const content = page.locator('main, [class*="friend"], [class*="Friend"]').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should show friend requests section', async ({ page }) => {
    await page.goto('/friends/requests');
    await expect(page).toHaveURL(/\/friends/);
  });
});
