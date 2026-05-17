import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerAndLogin,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  navigateToGroup,
} from '../setup/test-fixtures';

test.describe('Groups - Display', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/groups');
  });

  test('should display groups page', async ({ page }) => {
    await expect(page).toHaveURL(/\/groups/);
  });

  test('should show groups sidebar search input', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search for Conversations"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show empty state when no groups exist', async ({ page }) => {
    await expect(page.locator('text=ConversationPanel')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Groups - Create Group', () => {
  test('should create a group via API and see it in list', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'E2E Test Group',
      users: [otherUser.username],
    });
    expect(groupRes.ok).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('text=Group').first().click();
    await expect(page.locator('text=E2E Test Group')).toBeVisible({ timeout: 8000 });
  });

  test('should navigate to created group channel', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Navigate Test Group',
      users: [otherUser.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    await navigateToGroup(page, 'Navigate Test Group');
    await expect(page).toHaveURL(new RegExp(`/groups/${group.id}`));
  });

  test('should send a message in a group', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Message Test Group',
      users: [otherUser.username],
    });
    expect(groupRes.ok).toBeTruthy();

    await navigateToGroup(page, 'Message Test Group');
    const textarea = page.locator('textarea');
    await textarea.fill('Group E2E message');
    await textarea.press('Enter');
    await expect(page.locator('text=Group E2E message')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Groups - Group Details', () => {
  test('should show group name in the channel header', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Header Display Group',
      users: [otherUser.username],
    });
    expect(groupRes.ok).toBeTruthy();

    await navigateToGroup(page, 'Header Display Group');
    await expect(page.locator('text=Header Display Group').first()).toBeVisible({ timeout: 8000 });
  });

  test('should show sent message after navigating to group', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Initial Msg Group',
      users: [otherUser.username],
    });
    expect(groupRes.ok).toBeTruthy();

    await navigateToGroup(page, 'Initial Msg Group');
    const textarea = page.locator('textarea');
    await textarea.fill('First group message');
    await textarea.press('Enter');
    await expect(page.locator('text=First group message')).toBeVisible({ timeout: 8000 });
  });

  test('should persist group message after page reload', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const otherUser = createTestUser();
    await registerUserViaAPI(otherUser);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Persist Group',
      users: [otherUser.username],
    });
    expect(groupRes.ok).toBeTruthy();

    await navigateToGroup(page, 'Persist Group');
    const textarea = page.locator('textarea');
    await textarea.fill('Reload persist check');
    await textarea.press('Enter');
    await expect(page.locator('text=Reload persist check')).toBeVisible({ timeout: 8000 });

    await page.reload();
    await expect(page.locator('text=Reload persist check')).toBeVisible({ timeout: 20000 });
  });

  test('should show group in sidebar for a member', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken } = await loginViaAPI(user1.username, user1.password);

    const groupRes = await apiRequest('POST', '/groups', accessToken, {
      title: 'Member Sidebar Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();

    // user2 should see the group in their sidebar
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/groups');
    await page.locator('text=Group').first().click();
    await expect(page.locator('text=Member Sidebar Group')).toBeVisible({ timeout: 8000 });
  });
});
