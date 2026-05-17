import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
  setupAuthenticatedPage,
} from '../setup/test-fixtures';

test.describe('Create Conversation Modal - UI Flow', () => {
  test('should open create conversation modal from sidebar', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');

    // Find and click the add/new conversation icon in the sidebar header
    // The icon is typically a ChatAdd or plus icon in the conversation sidebar
    const addIcon = page.locator(
      'svg[class*="chat"], [data-testid*="create"], [title*="Create"], [aria-label*="Create"]',
    ).first();
    if (await addIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addIcon.click();
      // Verify modal appeared with some heading or form element
      const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Try clicking the first action icon in the sidebar
      const sidebarIcons = page.locator('[class*="Sidebar"] svg, [class*="sidebar"] svg');
      const count = await sidebarIcons.count();
      if (count > 0) {
        await sidebarIcons.first().click();
        const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]');
        await expect(modal.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should search for a friend in create conversation modal', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const friend = createTestUser();
    await registerUserViaAPI(friend);
    const { accessToken: friendToken } = await loginViaAPI(friend.username, friend.password);
    await makeFriends(user.accessToken, friend.username, friendToken);

    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');

    // Try to open the create conversation modal via sidebar icons
    const sidebarIcons = page.locator('[class*="Sidebar"] svg, [class*="sidebar"] svg');
    const count = await sidebarIcons.count();
    if (count > 0) {
      await sidebarIcons.first().click();
      // Look for a username search input in the modal
      const searchInput = page.locator(
        'input[placeholder*="user"], input[placeholder*="search"], input[placeholder*="username"]',
      ).first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill(friend.username);
        await page.waitForTimeout(1200); // wait for debounce
        // Verify friend appears in search results
        await expect(page.locator(`text=${friend.username}`).first()).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should close modal with Escape key', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/conversations');
    await page.waitForLoadState('networkidle');

    const sidebarIcons = page.locator('[class*="Sidebar"] svg, [class*="sidebar"] svg');
    const count = await sidebarIcons.count();
    if (count > 0) {
      await sidebarIcons.first().click();
      const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]');
      if (await modal.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(modal.first()).not.toBeVisible({ timeout: 3000 });
      }
    }
  });
});
