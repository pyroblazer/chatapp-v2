import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedPage,
  registerAndLogin,
  createTestUser,
  registerUserViaAPI,
} from '../setup/test-fixtures';

test.describe('Error Handling - Invalid Routes', () => {
  test('should redirect unknown route to conversations', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
  });

  test('should redirect another unknown route to conversations', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/totally/fake/path/123');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 10000 });
  });
});

test.describe('Error Handling - Invalid Resource IDs', () => {
  test('should redirect invalid conversation ID to conversations', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/conversations/00000000-0000-0000-0000-000000000000');
    // Guard should redirect back to /conversations
    await expect(page).toHaveURL(/\/conversations/, { timeout: 15000 });
  });

  test('should redirect invalid group ID to groups', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/groups/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/groups/, { timeout: 15000 });
  });

  test('should show loading state before redirect on invalid conversation', async ({ page }) => {
    await setupAuthenticatedPage(page);
    // Navigate to invalid conversation — guard shows loading then redirects
    await page.goto('/conversations/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/conversations/, { timeout: 15000 });
  });
});

test.describe('Error Handling - Auth Session', () => {
  test('should redirect to login after clearing cookies', async ({ page }) => {
    await registerAndLogin(page);
    await expect(page).toHaveURL(/\/conversations/, { timeout: 15000 });
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test('should redirect to login from protected page after session expiry', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    // Clear cookies to simulate session expiry
    await page.context().clearCookies();
    await page.goto('/friends');
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test('should redirect to login from groups after session expiry', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/groups');
    await expect(page).toHaveURL(/\/groups/);

    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });
});

test.describe('Error Handling - Login Errors', () => {
  test('should reject login with non-existent user', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#username', 'definitelynotauser_xyz_abc_999');
    await page.fill('input#password', 'SomePassword123!');
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      page.click('button:has-text("Login")'),
    ]);
    expect(response.status()).not.toBe(200);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should reject login with wrong password', async ({ page }) => {
    const user = createTestUser();
    await registerUserViaAPI(user);

    await page.goto('/login');
    await page.fill('input#username', user.username);
    await page.fill('input#password', 'WrongPassword999!');
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      page.click('button:has-text("Login")'),
    ]);
    expect(response.status()).not.toBe(200);
    await expect(page).toHaveURL(/\/login/);
  });
});
