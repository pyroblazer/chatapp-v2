import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input')).toBeVisible();
  });

  test('should show the register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input')).toBeVisible();
  });
});
