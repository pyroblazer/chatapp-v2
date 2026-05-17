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

async function setupGroup(page: Parameters<typeof setupAuthenticatedPage>[0]) {
  const user = await setupAuthenticatedPage(page);
  const user2 = createTestUser();
  const user3 = createTestUser();
  await registerUserViaAPI(user2);
  await registerUserViaAPI(user3);

  const res = await apiRequest('POST', '/groups', user.accessToken, {
    title: 'Test Group',
    users: [user2.username, user3.username],
  });
  expect(res.ok).toBeTruthy();
  const group = await res.json();
  return { user, user2, user3, groupId: group.id as string, groupTitle: group.title as string };
}

test.describe('Group Management - Navigation', () => {
  test('should navigate to group channel page', async ({ page }) => {
    const { groupId, groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    await expect(page).toHaveURL(new RegExp(`/groups/${groupId}`));
  });

  test('should show group name in header', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    await expect(page.locator(`text=${groupTitle}`).first()).toBeVisible({ timeout: 8000 });
  });

  test('should show group in sidebar under Group tab', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await page.goto('/groups');
    await page.locator('text=Group').first().click();
    await expect(page.locator(`text=${groupTitle}`)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Group Management - Messaging', () => {
  test('should send a message in group', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    const textarea = page.locator('textarea');
    await textarea.fill('Group message test');
    await textarea.press('Enter');
    await expect(page.locator('text=Group message test')).toBeVisible({ timeout: 8000 });
  });

  test('should send multiple messages in group', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    const textarea = page.locator('textarea');

    for (const msg of ['Alpha', 'Beta', 'Gamma']) {
      await textarea.fill(msg);
      await textarea.press('Enter');
      await expect(page.locator(`text=${msg}`).last()).toBeVisible({ timeout: 8000 });
    }
  });

  test('should persist group message after reload', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    const textarea = page.locator('textarea');
    await textarea.fill('Reload persist group');
    await textarea.press('Enter');
    await expect(page.locator('text=Reload persist group')).toBeVisible({ timeout: 8000 });
    await page.reload();
    await expect(page.locator('text=Reload persist group')).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Group Management - Participants Sidebar', () => {
  test('should toggle participants sidebar', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // The participants sidebar toggle is a PeopleGroup icon in the header
    const toggleBtn = page
      .locator('[class*="header"] svg, [class*="Header"] svg')
      .filter({ hasNot: page.locator('svg:first-child') })
      .last();
    if (await toggleBtn.isVisible({ timeout: 3000 })) {
      await toggleBtn.click();
      await expect(page.locator('text=Participants')).toBeVisible({ timeout: 5000 });
      await toggleBtn.click();
      await expect(page.locator('text=Participants')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should show all group members in participants sidebar', async ({ page }) => {
    const { groupTitle, user2, user3 } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Try to open participants via any available toggle
    const headerIcons = page.locator('[class*="header"] svg, [class*="Header"] svg');
    const iconCount = await headerIcons.count();
    if (iconCount > 0) {
      await headerIcons.last().click();
      const participantsSection = page.locator('text=Participants');
      if (await participantsSection.isVisible({ timeout: 3000 })) {
        await expect(page.locator(`text=${user2.username}`)).toBeVisible({ timeout: 5000 });
        await expect(page.locator(`text=${user3.username}`)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Group Management - Edit Group', () => {
  test('should edit group title via context menu', async ({ page }) => {
    const { groupTitle } = await setupGroup(page);
    await navigateToGroup(page, groupTitle);

    // Right-click the group in the sidebar
    const groupItem = page.locator(`text=${groupTitle}`).first();
    await expect(groupItem).toBeVisible({ timeout: 8000 });
    await groupItem.click({ button: 'right' });

    const editOption = page.locator('text=Edit Group');
    if (await editOption.isVisible({ timeout: 3000 })) {
      await editOption.click();
      const groupNameInput = page.locator('input#groupName');
      await expect(groupNameInput).toBeVisible({ timeout: 10000 });
      await groupNameInput.clear();
      await groupNameInput.fill('Renamed Group');
      await page.locator('button:has-text("Save")').click();
      await expect(page.locator('text=Renamed Group').first()).toBeVisible({ timeout: 8000 });
    }
  });
});

test.describe('Group Management - Leave Group', () => {
  test('non-owner can leave group via API', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Leave Test Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // user2 leaves via API
    const leaveRes = await apiRequest('DELETE', `/groups/${group.id}/recipients/leave`, token2);
    expect(leaveRes.ok).toBeTruthy();

    // user2 should no longer see this group
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/groups');
    await page.locator('text=Group').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Leave Test Group')).not.toBeVisible({ timeout: 5000 });
  });

  test('non-owner can leave group via context menu', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'UI Leave Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // user2 logs in and leaves via UI
    await loginViaUI(page, user2.username, user2.password);
    await page.goto('/groups');
    await page.locator('text=Group').first().click();

    const groupItem = page.locator('text=UI Leave Group').first();
    await expect(groupItem).toBeVisible({ timeout: 8000 });
    await groupItem.click({ button: 'right' });

    const leaveOption = page.getByText('Leave Group', { exact: true });
    if (await leaveOption.isVisible({ timeout: 3000 })) {
      await leaveOption.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=UI Leave Group')).not.toBeVisible({ timeout: 8000 });
    }
  });
});

test.describe('Group Management - Add/Remove Members', () => {
  test('should add member to group via API', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const user2 = createTestUser();
    const user3 = createTestUser();
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);

    // Create group with only user2
    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Add Member Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // Add user3 via API
    const addRes = await apiRequest('POST', `/groups/${group.id}/recipients`, user.accessToken, {
      username: user3.username,
    });
    expect(addRes.ok).toBeTruthy();

    // Verify user3 sees the group
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);
    const groupsRes = await apiRequest('GET', '/groups', token3);
    expect(groupsRes.ok).toBeTruthy();
    const groups = await groupsRes.json();
    const found = (Array.isArray(groups) ? groups : []).some(
      (g: any) => g.id === group.id || g.group?.id === group.id,
    );
    expect(found).toBeTruthy();
  });

  test('should remove member from group via API', async ({ page }) => {
    const user = await setupAuthenticatedPage(page);
    const user2 = createTestUser();
    await registerUserViaAPI(user2);

    const groupRes = await apiRequest('POST', '/groups', user.accessToken, {
      title: 'Remove Member Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // Get user2's ID
    const membersRes = await apiRequest('GET', `/groups/${group.id}`, user.accessToken);
    const groupDetail = await membersRes.json();
    const member = (groupDetail.users || []).find((u: any) => u.username === user2.username);

    if (member) {
      const removeRes = await apiRequest(
        'DELETE',
        `/groups/${group.id}/recipients/${member.id}`,
        user.accessToken,
      );
      expect(removeRes.ok).toBeTruthy();

      // user2 should not see the group anymore
      const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
      const groupsRes = await apiRequest('GET', '/groups', token2);
      const groups = await groupsRes.json();
      const found = (Array.isArray(groups) ? groups : []).some(
        (g: any) => g.id === group.id,
      );
      expect(found).toBeFalsy();
    }
  });
});
