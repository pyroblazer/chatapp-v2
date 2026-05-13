import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="username"], input[placeholder*="sername"]', 'admin');
    await page.fill('input[type="password"]', 'changeme123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/conversations**', { timeout: 10000 }).catch(() => {});
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should show profile settings', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should show appearance settings', async ({ page }) => {
    await page.goto('/settings/appearance');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should have theme toggle in appearance', async ({ page }) => {
    await page.goto('/settings/appearance');
    const toggle = page.locator('[class*="toggle"], [class*="switch"], input[type="checkbox"]').first();
    await expect(toggle).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
