import { test, expect } from '@playwright/test';
import { setupAuthenticatedPage, apiRequest } from '../setup/test-fixtures';

test.describe('Profile - Update', () => {
  test('should display current username on profile page', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    await page.goto('/settings/profile');
    await expect(page.locator(`text=@${user.username}`)).toBeVisible({ timeout: 8000 });
  });

  test('should update About Me bio and persist after reload', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/settings/profile');

    // The About Me section has a label + SVG edit icon in the same container.
    // Click the SVG icon next to the "About Me" label to enable editing.
    await expect(page.locator('text=About Me')).toBeVisible({ timeout: 8000 });
    await page.locator('text=About Me').locator('xpath=../..').locator('svg').click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeEnabled({ timeout: 5000 });
    await textarea.clear();
    await textarea.fill('My updated bio text');

    await expect(page.locator('button:has-text("Save")')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Save")').click();

    // After save the edit bar disappears; bio text remains in textarea
    await expect(page.locator('text=My updated bio text')).toBeVisible({ timeout: 8000 });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=My updated bio text')).toBeVisible({ timeout: 8000 });
  });

  test('should change password and re-login with new password', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const newPassword = 'NewPass456!';

    const res = await apiRequest('POST', '/auth/change-password', user.accessToken, {
      currentPassword: user.password,
      newPassword,
    });
    expect(res.ok).toBeTruthy();

    await page.goto('/login');
    await page.fill('input#username', user.username);
    await page.fill('input#password', newPassword);
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/conversations**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/conversations/);
  });
});
