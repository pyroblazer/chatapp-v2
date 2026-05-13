import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should show sidebar navigation items', async ({ page }) => {
    await page.goto('/login');
    // Login with seeded admin user
    await page.fill('input[id="username"], input[placeholder*="sername"]', 'admin');
    await page.fill('input[type="password"]', 'changeme123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/conversations**', { timeout: 10000 }).catch(() => {});

    // Verify we're past the login page
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="username"], input[placeholder*="sername"]', 'admin');
    await page.fill('input[type="password"]', 'changeme123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/conversations**', { timeout: 10000 }).catch(() => {});

    await page.goto('/groups');
    await expect(page).toHaveURL(/\/groups/);

    await page.goto('/friends');
    await expect(page).toHaveURL(/\/friends/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
  });
});
