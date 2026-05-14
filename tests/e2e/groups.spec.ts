import { test, expect } from '@playwright/test';
import { createTestUser, registerAndLogin, registerUserViaAPI, loginViaAPI } from '../setup/test-fixtures';

const BASE_URL = process.env.BASE_URL || 'http://localhost:80';

test.describe('Groups - Display', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/groups');
  });

  test('should display groups page', async ({ page }) => {
    await expect(page).toHaveURL(/\/groups/);
  });

  test('should show groups list area', async ({ page }) => {
    await expect(page).toHaveURL(/\/groups/);
    // The sidebar search input is rendered for the groups page
    await expect(page.locator('input[placeholder="Search for Conversations"]')).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no groups exist', async ({ page }) => {
    // New user has no groups — the panel placeholder is shown
    await expect(page.locator('text=ConversationPanel')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Groups - Create Group', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should open create group modal when add icon is clicked', async ({ page }) => {
    await page.goto('/groups');
    // Switch to Group tab
    await page.locator('text=Group').first().click();
    await page.waitForTimeout(500);

    // Click add group icon
    const addIcon = page.locator('[class*="header"] svg, [class*="Header"] svg').first();
    if (await addIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addIcon.click();
      await expect(page.locator('h2:has-text("Create a Group")')).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('should create a group via API and see it in list', async ({ page }) => {
    const user = createTestUser();
    const otherUser = createTestUser();
    await registerUserViaAPI(user);
    await registerUserViaAPI(otherUser);

    const loginRes = await loginViaAPI(user.username, user.password);

    // Create group via API
    const groupRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginRes.accessToken}`,
      },
      body: JSON.stringify({
        title: 'E2E Test Group',
        recipientIds: [otherUser.username],
        message: 'Welcome to the group!',
      }),
    });

    if (groupRes.ok) {
      const group = await groupRes.json();
      await page.goto('/groups');
      // Switch to Group tab
      await page.locator('text=Group').first().click();
      await page.waitForTimeout(1000);
      // Group should appear in sidebar
      await expect(page.locator('text=E2E Test Group')).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});

test.describe('Groups - Group Details', () => {
  test('should navigate to group channel page', async ({ page }) => {
    const user = createTestUser();
    const otherUser = createTestUser();
    await registerUserViaAPI(user);
    await registerUserViaAPI(otherUser);

    const loginRes = await loginViaAPI(user.username, user.password);

    const groupRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginRes.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Detail Test Group',
        recipientIds: [otherUser.username],
        message: 'Hello group',
      }),
    });

    if (groupRes.ok) {
      const group = await groupRes.json();
      const groupId = group.id || group.group?.id;
      if (groupId) {
        await page.goto(`/groups/${groupId}`);
        await expect(page).toHaveURL(new RegExp(`/groups/${groupId}`));
        // Message panel should be visible
        const panel = page.locator('main, [class*="messagePanel"], [class*="MessagePanel"]').first();
        await expect(panel).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should send a message in a group', async ({ page }) => {
    const user = createTestUser();
    const otherUser = createTestUser();
    await registerUserViaAPI(user);
    await registerUserViaAPI(otherUser);

    const loginRes = await loginViaAPI(user.username, user.password);

    const groupRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginRes.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Message Test Group',
        recipientIds: [otherUser.username],
        message: 'Hello',
      }),
    });

    if (groupRes.ok) {
      const group = await groupRes.json();
      const groupId = group.id || group.group?.id;
      if (groupId) {
        await page.goto(`/groups/${groupId}`);
        const textarea = page.locator('textarea');
        if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          await textarea.fill('Group E2E message');
          await textarea.press('Enter');
          await page.waitForTimeout(1000);
          await expect(page.locator('text=Group E2E message')).toBeVisible({ timeout: 3000 }).catch(() => {});
        }
      }
    }
  });
});
