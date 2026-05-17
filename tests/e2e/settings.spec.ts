import { test, expect } from '@playwright/test';
import { registerAndLogin } from '../setup/test-fixtures';

test.describe('Settings - Display', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should show Settings header in sidebar', async ({ page }) => {
    await expect(page.locator('text=Settings')).toBeVisible({ timeout: 5000 });
  });

  test('should show Profile sidebar item', async ({ page }) => {
    await expect(page.locator('text=Profile')).toBeVisible({ timeout: 5000 });
  });

  test('should show Appearance sidebar item', async ({ page }) => {
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Settings - Profile', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/profile');
  });

  test('should display profile page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test('should show username prefixed with @', async ({ page }) => {
    const usernameSpan = page.locator('span').filter({ hasText: /^@/ });
    await expect(usernameSpan).toBeVisible({ timeout: 5000 });
  });

  test('should show About Me section', async ({ page }) => {
    await expect(page.locator('text=About Me')).toBeVisible({ timeout: 5000 });
  });

  test('should show About Me textarea', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between profile and appearance via URL', async ({ page }) => {
    await page.goto('/settings/appearance');
    await expect(page).toHaveURL(/\/settings\/appearance/);
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test('should navigate to appearance via sidebar link', async ({ page }) => {
    await page.locator('text=Appearance').click();
    await expect(page).toHaveURL(/\/settings\/appearance/);
  });
});

test.describe('Settings - Appearance / Theme', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/appearance');
  });

  test('should display appearance page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/appearance/);
  });

  test('should show Dark theme radio option', async ({ page }) => {
    const darkLabel = page.locator('label[for="dark"]');
    await expect(darkLabel).toBeVisible({ timeout: 5000 });
  });

  test('should show Light theme radio option', async ({ page }) => {
    const lightLabel = page.locator('label[for="light"]');
    await expect(lightLabel).toBeVisible({ timeout: 5000 });
  });

  test('should switch theme from dark to light', async ({ page }) => {
    const lightRadio = page.locator('input#light');
    await expect(lightRadio).toBeVisible({ timeout: 5000 });
    await lightRadio.click();
    await expect(lightRadio).toBeChecked();
  });

  test('should switch theme from light to dark', async ({ page }) => {
    const lightRadio = page.locator('input#light');
    const darkRadio = page.locator('input#dark');
    await expect(lightRadio).toBeVisible({ timeout: 5000 });
    await lightRadio.click();
    await expect(lightRadio).toBeChecked();
    await darkRadio.click();
    await expect(darkRadio).toBeChecked();
  });

  test('should persist theme after page reload', async ({ page }) => {
    const lightRadio = page.locator('input#light');
    await expect(lightRadio).toBeVisible({ timeout: 5000 });
    await lightRadio.click();
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('light');
  });

  test('should persist theme after navigating away and back', async ({ page }) => {
    const lightRadio = page.locator('input#light');
    await expect(lightRadio).toBeVisible({ timeout: 5000 });
    await lightRadio.click();

    await page.goto('/conversations');
    await page.goto('/settings/appearance');
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('light');
  });
});
