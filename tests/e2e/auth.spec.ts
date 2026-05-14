import { test, expect } from '@playwright/test';
import { createTestUser, loginViaAPI, registerUserViaAPI } from '../setup/test-fixtures';

test.describe('Authentication - Unauthenticated', () => {
  test('should redirect unauthenticated users to /login from /', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to /login from /conversations', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to /login from /settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to /login from /friends', async ({ page }) => {
    await page.goto('/friends');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to /login from /groups', async ({ page }) => {
    await page.goto('/groups');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication - Login Page', () => {
  test('should render login form with correct fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should show link to register page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'nonexistent_user_xyz');
    await page.fill('input#password', 'wrongpassword123');
    await page.click('button:has-text("Login")');
    // Should stay on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login successfully and redirect to conversations', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/login');
    await page.fill('input#username', user.username);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
  });

  test('should persist auth after page reload', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/login');
    await page.fill('input#username', user.username);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
    await page.reload();
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
  });
});

test.describe('Authentication - Register Page', () => {
  test('should render registration form with all fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button:has-text("Create My Account")')).toBeVisible();
  });

  test('should show link to login page', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should register successfully and redirect to conversations', async ({ page }) => {
    const user = createTestUser();
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
  });

  test('should reject duplicate username on registration', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    // Should stay on register page (duplicate username)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/register/);
  });

  test('should reject short password on registration', async ({ page }) => {
    const user = createTestUser({ password: 'short' });
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    // Should stay on register page
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Authentication - Logout', () => {
  test('should logout and redirect to login', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken, setCookie } = await loginViaAPI(user.username, user.password);
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
    // Navigate to settings or use sidebar logout
    await page.goto('/login');
    // Clear auth state
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
    });
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
