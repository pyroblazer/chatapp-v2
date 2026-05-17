import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerAndLogin,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  makeFriends,
  navigateToConversation,
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
});

test.describe('Conversations - Create Conversation', () => {
  test('should create conversation via API and see it in sidebar', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);
    const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
    await makeFriends(user.accessToken, otherUser.username, token2);

    const res = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'Hello from E2E',
    });
    expect(res.ok).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('networkidle');
    const conversationItem = page
      .locator(`text=${otherUser.firstName}`)
      .or(page.locator(`text=${otherUser.username}`));
    await expect(conversationItem.first()).toBeVisible({ timeout: 8000 });
  });

  test('should navigate to created conversation', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);
    const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
    await makeFriends(user.accessToken, otherUser.username, token2);

    const res = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'Navigate test',
    });
    expect(res.ok).toBeTruthy();
    const conv = await res.json();

    await navigateToConversation(page, conv.id, `${otherUser.firstName} ${otherUser.lastName}`);
    await expect(page).toHaveURL(new RegExp(`/conversations/${conv.id}`));
    await expect(page.locator('textarea')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Conversations - Send Message', () => {
  test('should send a message in a conversation', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);
    const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
    await makeFriends(user.accessToken, otherUser.username, token2);

    const convRes = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'First message',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    await navigateToConversation(page, conv.id, `${otherUser.firstName} ${otherUser.lastName}`);
    const textarea = page.locator('textarea');
    await textarea.fill('E2E test message');
    await textarea.press('Enter');
    await expect(page.locator('text=E2E test message')).toBeVisible({ timeout: 8000 });
  });

  test('should show existing messages when navigating to conversation', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);
    const { accessToken: token2 } = await loginViaAPI(otherUser.username, otherUser.password);
    await makeFriends(user.accessToken, otherUser.username, token2);

    const convRes = await apiRequest('POST', '/conversations', user.accessToken, {
      username: otherUser.username,
      message: 'Existing message check',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    await navigateToConversation(page, conv.id, `${otherUser.firstName} ${otherUser.lastName}`);
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

    const { accessToken: tokenA } = await loginViaAPI(userAlpha.username, userAlpha.password);
    const { accessToken: tokenB } = await loginViaAPI(userBeta.username, userBeta.password);
    await makeFriends(user.accessToken, userAlpha.username, tokenA);
    await makeFriends(user.accessToken, userBeta.username, tokenB);

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
    await page.waitForTimeout(600);

    await expect(page.locator('text=Alphaxxx')).toBeVisible({ timeout: 5000 });
  });

  test('should clear search restores conversation list', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);

    const userA = createTestUser();
    const userB = createTestUser();
    await registerUserViaAPI(userA);
    await registerUserViaAPI(userB);
    const { accessToken: tA } = await loginViaAPI(userA.username, userA.password);
    const { accessToken: tB } = await loginViaAPI(userB.username, userB.password);
    await makeFriends(user.accessToken, userA.username, tA);
    await makeFriends(user.accessToken, userB.username, tB);

    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userA.username,
      message: 'hello a',
    });
    await apiRequest('POST', '/conversations', user.accessToken, {
      username: userB.username,
      message: 'hello b',
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Search for Conversations"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill(userA.username);
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(300);

    await expect(
      page.locator(`text=${userA.firstName}`).or(page.locator(`text=${userA.username}`)).first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator(`text=${userB.firstName}`).or(page.locator(`text=${userB.username}`)).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
