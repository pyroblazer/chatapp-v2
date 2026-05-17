import { test, expect } from '@playwright/test';
import { setupAuthenticatedPage, registerAndLogin } from '../setup/test-fixtures';

test.describe('Profile - Display', () => {
  test('should show profile page', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test('should show username with @ prefix', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    await page.goto('/settings/profile');
    const usernameSpan = page.locator('span').filter({ hasText: /^@/ });
    await expect(usernameSpan).toBeVisible({ timeout: 5000 });
    const text = await usernameSpan.textContent();
    expect(text).toContain(user.username);
  });

  test('should show About Me section', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/profile');
    await expect(page.locator('text=About Me')).toBeVisible({ timeout: 5000 });
  });

  test('should show About Me textarea', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/profile');
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile - Update', () => {
  test('should update About Me bio and persist after reload', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/settings/profile');

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const isDisabled = await textarea.isDisabled();
    if (isDisabled) {
      const aboutSection = page.locator('text=About Me');
      const editIcon = aboutSection.locator('..').locator('svg').first();
      if (await editIcon.isVisible({ timeout: 3000 })) {
        await editIcon.click();
      }
    }

    const bioText = `E2E bio ${Date.now()}`;
    await textarea.clear();
    await textarea.fill(bioText);

    const saveBtn = page.locator('button').filter({ hasText: /save|update/i });
    if (await saveBtn.isVisible({ timeout: 2000 })) {
      await saveBtn.click();
    } else {
      await textarea.press('Escape');
    }

    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadedTextarea = page.locator('textarea').first();
    await expect(reloadedTextarea).toBeVisible({ timeout: 5000 });
    const value = await reloadedTextarea.inputValue();
    expect(value).toContain(bioText);
  });
});

test.describe('Profile - Settings Navigation', () => {
  test('should navigate to appearance via sidebar', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/profile');
    await page.locator('text=Appearance').click();
    await expect(page).toHaveURL(/\/settings\/appearance/);
  });

  test('should navigate back to profile from appearance', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/appearance');
    await page.locator('text=Profile').click();
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test('should show both Profile and Appearance in settings sidebar', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings');
    await expect(page.locator('text=Profile')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile - Theme', () => {
  test('should switch to light theme', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/appearance');
    const lightRadio = page.locator('input#light');
    await expect(lightRadio).toBeVisible({ timeout: 5000 });
    await lightRadio.click();
    await expect(lightRadio).toBeChecked();
  });

  test('should switch back to dark theme', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/appearance');
    await page.locator('input#light').click();
    await page.locator('input#dark').click();
    await expect(page.locator('input#dark')).toBeChecked();
  });

  test('should persist light theme to localStorage after selection', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/appearance');
    await page.locator('input#light').click();
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('light');
  });

  test('should persist dark theme to localStorage after selection', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings/appearance');
    await page.locator('input#light').click();
    await page.locator('input#dark').click();
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('dark');
  });
});
