import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerAndLogin,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Conversations - Unauthenticated', () => {
  test('should redirect to login when accessing conversations', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Conversations - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should display conversation page with sidebar', async ({ page }) => {
    await expect(page).toHaveURL(/\/conversations/);
    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should show Private and Group tabs', async ({ page }) => {
    await expect(page.locator('text=Private')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Group')).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no conversations exist', async ({ page }) => {
    await expect(page).toHaveURL(/\/conversations/);
    await expect(page.locator('text=ConversationPanel')).toBeVisible({ timeout: 5000 });
  });

  test('should switch between Private and Group tabs', async ({ page }) => {
    await page.locator('text=Group').first().click();
    await page.waitForLoadState('networkidle');
    await page.locator('text=Private').first().click();
    await page.waitForLoadState('networkidle');
  });

  test('should show search input for conversations', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
  });

  test('should show conversation panel placeholder when no conversation is selected', async ({ page }) => {
    await expect(page.locator('text=ConversationPanel')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to groups tab and back', async ({ page }) => {
    await page.locator('text=Group').first().click();
    await expect(page).toHaveURL(/\/(conversations|groups)/);
    await page.locator('text=Private').first().click();
    await expect(page).toHaveURL(/\/conversations/);
  });
});

test.describe('Conversations - Create Conversation', () => {
  test('should create conversation via API and see it in sidebar', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const res = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'Hello from E2E',
    });
    expect(res.ok).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('networkidle');
    const conversationItem = page.locator(`text=${otherUser.firstName}`).or(
      page.locator(`text=${otherUser.username}`),
    );
    await expect(conversationItem.first()).toBeVisible({ timeout: 8000 });
  });

  test('should navigate to created conversation', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const res = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'Navigate test',
    });
    expect(res.ok).toBeTruthy();
    const conv = await res.json();

    await page.goto(`/conversations/${conv.id}`);
    await expect(page).toHaveURL(new RegExp(`/conversations/${conv.id}`));
    await expect(page.locator('textarea')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Conversations - Send Message', () => {
  test('should send a message in a conversation', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const convRes = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'First message',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    await page.goto(`/conversations/${conv.id}`);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 8000 });
    await textarea.fill('E2E test message');
    await textarea.press('Enter');
    await expect(page.locator('text=E2E test message')).toBeVisible({ timeout: 8000 });
  });

  test('should show existing messages when navigating to conversation', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const convRes = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'Existing message check',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    await page.goto(`/conversations/${conv.id}`);
    await expect(page.locator('text=Existing message check')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Conversations - Search', () => {
  test('should filter conversations by search query', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const userAlpha = createTestUser();
    const userBeta = createTestUser();
    userAlpha.firstName = 'Alphaxxx';
    userBeta.firstName = 'Betaxxx';
    await registerUserViaAPI(userAlpha);
    await registerUserViaAPI(userBeta);

    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userAlpha.username,
      message: 'hi alpha',
    });
    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userBeta.username,
      message: 'hi beta',
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Alphaxxx');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Alphaxxx')).toBeVisible({ timeout: 5000 });
  });
});
