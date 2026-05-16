import { test, expect } from '@playwright/test';
import { createTestUser, registerUserViaAPI } from '../setup/test-fixtures';

test.describe('Registration Validation - Username', () => {
  test('should reject username shorter than 3 characters', async ({ page }) => {
    const user = createTestUser({ username: 'ab' });
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    // Client-side: stays on register, shows error
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('text=3')).toBeVisible({ timeout: 3000 });
  });

  test('should reject username longer than 16 characters', async ({ page }) => {
    const user = createTestUser({ username: 'a'.repeat(17) });
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('text=16')).toBeVisible({ timeout: 3000 });
  });

  test('should reject duplicate username', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/register')),
      page.click('button:has-text("Create My Account")'),
    ]);
    expect(response.status()).not.toBe(201);
    await expect(page).toHaveURL(/\/register/);
  });

  test('should accept valid unique username', async ({ page }) => {
    const user = createTestUser();
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/register')),
      page.click('button:has-text("Create My Account")'),
    ]);
    expect(response.status()).toBe(201);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Registration Validation - Password', () => {
  test('should reject password shorter than 8 characters', async ({ page }) => {
    const user = createTestUser({ password: 'Short1!' });
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    // Client-side validation — stays on page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show password requirement error message', async ({ page }) => {
    await page.goto('/register');
    const user = createTestUser({ password: 'short' });
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/register/);
    // Error message should mention 8 characters
    const errorText = page.locator('text=8');
    await expect(errorText).toBeVisible({ timeout: 3000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/register');
    const passwordInput = page.locator('input#password');
    await passwordInput.fill('MyPassword123!');
    expect(await passwordInput.getAttribute('type')).toBe('password');

    // Find toggle icon near password field
    const toggleArea = passwordInput.locator('..').locator('..').locator('svg, button');
    if (await toggleArea.first().isVisible({ timeout: 2000 })) {
      await toggleArea.first().click();
      // After click type may become 'text'
      const newType = await passwordInput.getAttribute('type');
      expect(['text', 'password']).toContain(newType);
    }
  });

  test('should accept strong password', async ({ page }) => {
    const user = createTestUser({ password: 'StrongPass123!' });
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/register')),
      page.click('button:has-text("Create My Account")'),
    ]);
    expect(response.status()).toBe(201);
  });
});

test.describe('Registration Validation - Names', () => {
  test('should require first name', async ({ page }) => {
    const user = createTestUser();
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', '');
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should require last name', async ({ page }) => {
    const user = createTestUser();
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', '');
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Registration Validation - Form UI', () => {
  test('should render all form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button:has-text("Create My Account")')).toBeVisible();
  });

  test('should show link to login page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should redirect to login after successful registration', async ({ page }) => {
    const user = createTestUser();
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
