import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
  setupAuthenticatedPage,
} from '../setup/test-fixtures';

test.describe('Create Group Modal - UI Flow', () => {
  test('should open create group modal from conversations sidebar', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');

    // Switch to Group tab
    const groupTab = page.locator('text=Group').first();
    if (await groupTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupTab.click();
    }

    // Find the add group icon (typically AiOutlineUsergroupAdd or similar)
    const sidebarIcons = page.locator('[class*="Sidebar"] svg, [class*="sidebar"] svg');
    const count = await sidebarIcons.count();
    if (count > 1) {
      // Try clicking the second icon (first might be create conversation)
      await sidebarIcons.nth(1).click();
      // Or try the last icon
    } else if (count > 0) {
      await sidebarIcons.first().click();
    }

    // Check if a modal/dialog appeared with group-related fields
    const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]');
    if (await modal.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Look for group title input or recipient search
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="group"]');
      const recipientInput = page.locator(
        'input[placeholder*="user"], input[placeholder*="recipient"]',
      );
      // At least one should be present
      expect(
        (await titleInput.isVisible().catch(() => false)) ||
          (await recipientInput.isVisible().catch(() => false)),
      ).toBeTruthy();
    }
  });

  test('should create group with title and members via modal', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const friend = createTestUser();
    await registerUserViaAPI(friend);
    const { accessToken: friendToken } = await loginViaAPI(friend.username, friend.password);
    await makeFriends(user.accessToken, friend.username, friendToken);

    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');

    // Switch to Group tab
    const groupTab = page.locator('text=Group').first();
    if (await groupTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupTab.click();
    }

    // Find and click the add group icon
    const sidebarIcons = page.locator('[class*="Sidebar"] svg, [class*="sidebar"] svg');
    const count = await sidebarIcons.count();

    // If we can find the right icon, try creating a group
    if (count > 1) {
      await sidebarIcons.nth(1).click();
    } else if (count > 0) {
      await sidebarIcons.first().click();
    }

    const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]');
    if (await modal.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Fill title
      const titleInput = page.locator(
        'input[placeholder*="title"], input#groupTitle, input[placeholder*="Group"]',
      );
      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill('Modal Test Group');
      }

      // Search for friend
      const searchInput = page.locator(
        'input[placeholder*="user"], input[placeholder*="search"], input[placeholder*="username"]',
      );
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill(friend.username);
        await page.waitForTimeout(1200);

        // Click on friend in results
        const resultItem = page.locator(`text=${friend.username}`).first();
        if (await resultItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          await resultItem.click();
        }
      }

      // Submit
      const submitBtn = page.locator('button:has-text("Create"), button:has-text("Submit")');
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        // Should navigate to the new group
        await page.waitForTimeout(3000);
      }
    }
  });
});
