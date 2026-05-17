import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

test.describe('Real-time DM Delivery', () => {
  test('should deliver DM to recipient in real-time without page refresh', async ({
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
      message: 'Initial message',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // user2 logs in and navigates to conversation
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    const nameLocator = page2
      .locator(`text=${user1.firstName} ${user1.lastName}`)
      .first();
    await expect(nameLocator).toBeVisible({ timeout: 10000 });
    await nameLocator.click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in and navigates to same conversation
    await loginViaUI(page, user1.username, user1.password);
    const name2 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(name2).toBeVisible({ timeout: 10000 });
    await name2.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 sends a message
    const rtMsg = `RTMsg${Date.now().toString(36)}`;
    await page.locator('textarea').fill(rtMsg);
    await page.locator('textarea').press('Enter');

    // user2 should see it without reload
    await expect(page2.locator(`text=${rtMsg}`).last()).toBeVisible({ timeout: 10000 });

    await ctx2.close();
  });

  test('should deliver multiple DMs in order in real-time', async ({ page, browser }) => {
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
    const name = page2.locator(`text=${user1.firstName} ${user1.lastName}`).first();
    await expect(name).toBeVisible({ timeout: 10000 });
    await name.click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in
    await loginViaUI(page, user1.username, user1.password);
    const name2 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(name2).toBeVisible({ timeout: 10000 });
    await name2.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    const msgs = [`RT1_${Date.now()}`, `RT2_${Date.now()}`, `RT3_${Date.now()}`];
    for (const msg of msgs) {
      await page.locator('textarea').fill(msg);
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/messages') && r.request().method() === 'POST' && r.status() === 201,
          { timeout: 10000 },
        ),
        page.locator('textarea').press('Enter'),
      ]);
    }

    // user2 sees all messages
    for (const msg of msgs) {
      await expect(page2.locator(`text=${msg}`).last()).toBeVisible({ timeout: 10000 });
    }

    await ctx2.close();
  });
});

test.describe('Real-time Group Message Delivery', () => {
  test('should deliver group message to all members in real-time', async ({
    page,
    browser,
  }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'RT Group Test',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // user2 logs in and navigates to group
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.goto('/groups');
    await page2.waitForLoadState('networkidle');
    const groupTab = page2.locator('text=Group').first();
    if (await groupTab.isVisible({ timeout: 3000 }).catch(() => false)) await groupTab.click();
    await expect(page2.locator('text=RT Group Test').first()).toBeVisible({ timeout: 10000 });
    await page2.locator('text=RT Group Test').first().click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 logs in and navigates to group
    await loginViaUI(page, user1.username, user1.password);
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    const groupTab1 = page.locator('text=Group').first();
    if (await groupTab1.isVisible({ timeout: 3000 }).catch(() => false)) await groupTab1.click();
    await expect(page.locator('text=RT Group Test').first()).toBeVisible({ timeout: 10000 });
    await page.locator('text=RT Group Test').first().click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 sends message
    const grpMsg = `GrpRT${Date.now().toString(36)}`;
    await page.locator('textarea').fill(grpMsg);
    await page.locator('textarea').press('Enter');

    // user2 sees it
    await expect(page2.locator(`text=${grpMsg}`).last()).toBeVisible({ timeout: 10000 });

    await ctx2.close();
  });

  test('should update edited message in real-time for other user', async ({
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

    // Both users navigate to conversation
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    const n2 = page2.locator(`text=${user1.firstName} ${user1.lastName}`).first();
    await expect(n2).toBeVisible({ timeout: 10000 });
    await n2.click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    await loginViaUI(page, user1.username, user1.password);
    const n1 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(n1).toBeVisible({ timeout: 10000 });
    await n1.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 sends message
    const origMsg = `OrigEdit${Date.now().toString(36)}`;
    await page.locator('textarea').fill(origMsg);
    await page.locator('textarea').press('Enter');
    await expect(page.locator(`text=${origMsg}`).last()).toBeVisible({ timeout: 8000 });

    // user1 edits it via context menu
    const msgLocator = page.locator(`text=${origMsg}`).last();
    await msgLocator.click({ button: 'right' });
    await expect(page.getByText('Edit', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByText('Edit', { exact: true }).click();
    await expect(page.locator('text=escape to cancel')).toBeVisible({ timeout: 3000 });

    const editedText = `Edited${Date.now().toString(36)}`;
    const editInput = page.getByRole('textbox').nth(1);
    await editInput.fill(editedText);
    await editInput.press('Enter');

    // user2 sees the edited content
    await expect(page2.locator(`text=${editedText}`).last()).toBeVisible({ timeout: 10000 });

    await ctx2.close();
  });

  test('should remove deleted message in real-time for other user', async ({
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

    // Both users navigate to conversation
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    const n2 = page2.locator(`text=${user1.firstName} ${user1.lastName}`).first();
    await expect(n2).toBeVisible({ timeout: 10000 });
    await n2.click();
    await expect(page2.locator('textarea')).toBeVisible({ timeout: 10000 });

    await loginViaUI(page, user1.username, user1.password);
    const n1 = page.locator(`text=${user2.firstName} ${user2.lastName}`).first();
    await expect(n1).toBeVisible({ timeout: 10000 });
    await n1.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // user1 sends a message
    const delMsg = `ToDelete${Date.now().toString(36)}`;
    await page.locator('textarea').fill(delMsg);
    await page.locator('textarea').press('Enter');
    await expect(page.locator(`text=${delMsg}`).last()).toBeVisible({ timeout: 8000 });

    // Wait for user2 to see it
    await expect(page2.locator(`text=${delMsg}`).last()).toBeVisible({ timeout: 10000 });

    // user1 deletes it via context menu
    const msgLoc = page.locator(`text=${delMsg}`).last();
    await msgLoc.click({ button: 'right' });
    await expect(page.getByText('Delete', { exact: true })).toBeVisible({ timeout: 5000 });
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/messages/') && r.request().method() === 'DELETE',
        { timeout: 5000 },
      ),
      page.getByText('Delete', { exact: true }).click(),
    ]);

    // user2 sees it disappear
    await expect(page2.locator(`text=${delMsg}`).last()).not.toBeVisible({ timeout: 10000 });

    await ctx2.close();
  });
});
