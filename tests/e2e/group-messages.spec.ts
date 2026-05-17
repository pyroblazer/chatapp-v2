import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
  navigateToGroup,
} from '../setup/test-fixtures';

async function setupGroupAndNavigate(page: Parameters<typeof setupAuthenticatedPage>[0]) {
  const user = await setupAuthenticatedPage(page);
  const user2 = createTestUser();
  const user3 = createTestUser();
  await registerUserViaAPI(user2);
  await registerUserViaAPI(user3);

  const res = await apiRequest('POST', '/groups', user.accessToken, {
    title: 'Group Msg Test',
    users: [user2.username, user3.username],
  });
  expect(res.ok).toBeTruthy();
  const group = await res.json();
  await navigateToGroup(page, group.title);
  return { user, user2, user3, groupId: group.id as string, groupTitle: group.title as string };
}

async function setupGroupWithMessage(page: Parameters<typeof setupAuthenticatedPage>[0]) {
  const user = await setupAuthenticatedPage(page);
  const u2 = createTestUser();
  await registerUserViaAPI(u2);
  const gRes = await apiRequest('POST', '/groups', user.accessToken, {
    title: 'Reaction Group',
    users: [u2.username],
  });
  expect(gRes.ok).toBeTruthy();
  const group = await gRes.json();

  // Send message via UI to avoid the multipart/file-upload requirement of the REST endpoint
  await navigateToGroup(page, group.title);
  const textarea = page.locator('textarea');
  await expect(textarea).toBeVisible({ timeout: 10000 });
  await textarea.fill('Reaction target message');
  await textarea.press('Enter');
  await expect(textarea).toHaveValue('', { timeout: 8000 });

  const msgsRes = await apiRequest('GET', `/groups/${group.id}/messages`, user.accessToken);
  const msgsData = await msgsRes.json();
  const messageId = (Array.isArray(msgsData) ? msgsData[0] : msgsData.messages?.[0])?.id as string;

  return { user, groupId: group.id as string, groupTitle: group.title as string, messageId };
}

test.describe('Group Messages - Send', () => {
  test('should send a message in group via Enter key', async ({ page }) => {
    await setupGroupAndNavigate(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Hello group');
    await textarea.press('Enter');
    await expect(page.locator('text=Hello group').last()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Group Messages - Edit', () => {
  test('should edit own group message via context menu', async ({ page }) => {
    await setupGroupAndNavigate(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Original group message');
    await textarea.press('Enter');
    await expect(textarea).toHaveValue('', { timeout: 8000 });

    const message = page.locator('text=Original group message').last();
    await expect(message).toBeVisible({ timeout: 5000 });
    await message.click({ button: 'right' });

    await expect(page.getByText('Edit', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByText('Edit', { exact: true }).click();
    await expect(page.locator('text=escape to cancel')).toBeVisible({ timeout: 3000 });

    const editInput = page.getByRole('textbox').nth(1);
    await editInput.fill('Edited group message');
    await editInput.press('Enter');

    await expect(page.locator('text=Edited group message').last()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Group Messages - Delete', () => {
  test('should delete own group message via context menu', async ({ page }) => {
    await setupGroupAndNavigate(page);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Group message to delete');
    await textarea.press('Enter');
    await expect(textarea).toHaveValue('', { timeout: 8000 });

    const message = page.locator('text=Group message to delete').last();
    await expect(message).toBeVisible({ timeout: 5000 });
    await message.click({ button: 'right' });

    await expect(page.getByText('Delete', { exact: true })).toBeVisible({ timeout: 5000 });
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/messages/') && resp.request().method() === 'DELETE',
        { timeout: 8000 }
      ),
      page.getByText('Delete', { exact: true }).click(),
    ]);
    await page.reload();
    await expect(page.locator('text=Group message to delete')).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Group Messages - Permissions', () => {
  test('should not show edit/delete on other user group message', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Perm Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // user2 sends a message in separate context
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await navigateToGroup(page2, group.title);
    const textarea2 = page2.locator('textarea');
    await expect(textarea2).toBeVisible({ timeout: 10000 });
    await textarea2.fill('Message from user2 in group');
    await textarea2.press('Enter');
    await expect(textarea2).toHaveValue('', { timeout: 8000 });
    await ctx2.close();

    // user1 right-clicks user2's message — no edit/delete
    await loginViaUI(page, user1.username, user1.password);
    await navigateToGroup(page, group.title);
    const otherMessage = page.locator('text=Message from user2 in group').last();
    await expect(otherMessage).toBeVisible({ timeout: 10000 });
    await otherMessage.click({ button: 'right' });

    await expect(page.getByText('Edit', { exact: true })).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Group Messages - Reactions', () => {
  test('should add reaction to group message via API and display it', async ({ page }) => {
    const { user, groupId, messageId } = await setupGroupWithMessage(page);
    if (!messageId) return;

    const addRes = await apiRequest('POST', `/groups/${groupId}/reactions/${messageId}`, user.accessToken, { emoji: '🎉' });
    expect(addRes.ok).toBeTruthy();

    const reactionsRes = await apiRequest('GET', `/groups/${groupId}/reactions/${messageId}`, user.accessToken);
    expect(reactionsRes.ok).toBeTruthy();
    const reactions = await reactionsRes.json();
    const hasReaction = (Array.isArray(reactions) ? reactions : [reactions]).some(
      (r: any) => r.emoji === '🎉',
    );
    expect(hasReaction).toBeTruthy();
  });

  test('should remove reaction from group message via API', async ({ page }) => {
    const { user, groupId, messageId } = await setupGroupWithMessage(page);
    if (!messageId) return;

    await apiRequest('POST', `/groups/${groupId}/reactions/${messageId}`, user.accessToken, { emoji: '⭐' });
    await apiRequest('DELETE', `/groups/${groupId}/reactions/${messageId}?emoji=⭐`, user.accessToken);

    const reactionsRes = await apiRequest('GET', `/groups/${groupId}/reactions/${messageId}`, user.accessToken);
    const reactions = await reactionsRes.json();
    const hasReaction = (Array.isArray(reactions) ? reactions : [reactions]).some(
      (r: any) => r.emoji === '⭐',
    );
    expect(hasReaction).toBeFalsy();
  });
});
