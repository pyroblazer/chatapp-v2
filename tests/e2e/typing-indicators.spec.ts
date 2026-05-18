import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Typing Indicators - Real-time DM', () => {
  test('should show typing indicator when other user types in DM', async ({
    page,
    browser,
  }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Setup',
    });
    expect(convRes.ok).toBeTruthy();

    // user2 logs in and navigates to conversation
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    const n2 = page2.locator(`text=${user1.firstName} ${user1.lastName}`).first();
    await expect(n2).toBeVisible({ timeout: 10000 });
    await n2.click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in and navigates to same conversation
    await loginViaUI(page, user1.username, user1.password);
    const n1 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(n1).toBeVisible({ timeout: 10000 });
    await n1.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 starts typing (fill triggers the input event)
    await page.locator('textarea').fill('typing test message');

    // user2 should see typing indicator
    await expect(page2.locator('text=is typing').last()).toBeVisible({ timeout: 15000 });

    await ctx2.close();
  });

  test('should remove typing indicator after user stops typing', async ({
    page,
    browser,
  }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Setup',
    });
    expect(convRes.ok).toBeTruthy();

    // user2 logs in
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.waitForLoadState('networkidle');
    const n2 = page2.locator(`text=${user1.firstName} ${user1.lastName}`).first();
    await expect(n2).toBeVisible({ timeout: 10000 });
    await n2.click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in
    await loginViaUI(page, user1.username, user1.password);
    await page.waitForLoadState('networkidle');
    const n1 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(n1).toBeVisible({ timeout: 10000 });
    await n1.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 types then sends (sending clears the typing state)
    await page.locator('textarea').fill('test');
    await expect(page2.locator('text=is typing').last()).toBeVisible({ timeout: 15000 });

    // user1 sends the message which clears typing
    await page.locator('textarea').press('Enter');
    await expect(page.locator('textarea')).toHaveValue('', { timeout: 8000 });

    // typing indicator should disappear
    await expect(page2.locator('text=is typing').last()).not.toBeVisible({ timeout: 10000 });

    await ctx2.close();
  });
});

test.describe('Typing Indicators - Isolation', () => {
  test('should not show typing indicator in unrelated conversation', async ({
    page,
    browser,
  }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    const user3 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);
    await makeFriends(token1, user2.username, token2);
    await makeFriends(token1, user3.username, token3);

    // Create conversation with user2
    const conv1 = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Conv1 setup',
    });
    expect(conv1.ok).toBeTruthy();

    // Create conversation with user3
    const conv2 = await apiRequest('POST', '/conversations', token1, {
      username: user3.username,
      message: 'Conv2 setup',
    });
    expect(conv2.ok).toBeTruthy();

    // user3 logs in and navigates to conv2 (with user1)
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await loginViaUI(page3, user3.username, user3.password);
    await page3.waitForLoadState('networkidle');
    const n3 = page3.locator(`text=${user1.firstName} ${user1.lastName}`).first();
    await expect(n3).toBeVisible({ timeout: 10000 });
    await n3.click();
    await expect(page3.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in and navigates to conv1 (with user2)
    await loginViaUI(page, user1.username, user1.password);
    await page.waitForLoadState('networkidle');
    const n1 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(n1).toBeVisible({ timeout: 10000 });
    await n1.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 types in conv1
    await page.locator('textarea').fill('typing in conv1');

    // user3 should NOT see typing indicator (they are in conv2, not conv1)
    await expect(page3.locator('text=is typing').last()).not.toBeVisible({ timeout: 5000 });

    await ctx3.close();
  });
});

test.describe('Typing Indicators - Group', () => {
  test('should show typing indicator in group conversation', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Typing Group Test',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();

    // user2 logs in and navigates to group
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.goto('/groups');
    await page2.waitForLoadState('networkidle');
    const gt = page2.locator('text=Group').first();
    if (await gt.isVisible({ timeout: 3000 }).catch(() => false)) await gt.click();
    await expect(page2.locator('text=Typing Group Test').first()).toBeVisible({ timeout: 10000 });
    await page2.locator('text=Typing Group Test').first().click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in and navigates to same group
    await loginViaUI(page, user1.username, user1.password);
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    const gt1 = page.locator('text=Group').first();
    if (await gt1.isVisible({ timeout: 3000 }).catch(() => false)) await gt1.click();
    await expect(page.locator('text=Typing Group Test').first()).toBeVisible({ timeout: 10000 });
    await page.locator('text=Typing Group Test').first().click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 types
    await page.locator('textarea').fill('typing in group');

    // user2 should see typing indicator
    await expect(page2.locator('text=is typing').last()).toBeVisible({ timeout: 15000 });

    await ctx2.close();
  });
});
