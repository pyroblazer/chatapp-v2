import { test, expect } from '@playwright/test';
import { createTestUser, registerUserViaAPI, registerAndLogin } from '../setup/test-fixtures';

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

  test('should redirect unauthenticated users to /login from /calls', async ({ page }) => {
    await page.goto('/calls');
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
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      page.click('button:has-text("Login")'),
    ]);
    expect(response.status()).not.toBe(200);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login successfully and redirect to conversations', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/login');
    await page.fill('input#username', user.username);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 15000 });
  });

  test('should persist auth after page reload', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/login');
    await page.fill('input#username', user.username);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 15000 });
    await page.reload();
    await expect(page).toHaveURL(/\/conversations/, { timeout: 15000 });
  });

  test('should not login with empty username', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#password', 'TestPass123!');
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should not login with empty password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'someuser');
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/login/);
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

  test('should register successfully and redirect to login', async ({ page }) => {
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

  test('should reject duplicate username on registration', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    await expect(page).toHaveURL(/\/register/, { timeout: 10000 });
  });

  test('should reject short password on registration', async ({ page }) => {
    const user = createTestUser({ password: 'short' });
    await page.goto('/register');
    await page.fill('input#username', user.username);
    await page.fill('input#firstName', user.firstName);
    await page.fill('input#lastName', user.lastName);
    await page.fill('input#password', user.password);
    await page.click('button:has-text("Create My Account")');
    // Client-side validation — no network request, stays on register
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Authentication - Logout', () => {
  test('should redirect to login after clearing auth cookies', async ({ page }) => {
    await registerAndLogin(page);
    await page.waitForURL('**/conversations**', { timeout: 15000 });
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});
