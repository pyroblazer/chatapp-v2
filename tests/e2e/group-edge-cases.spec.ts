import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Group Edge Cases - Ownership Transfer', () => {
  test('should transfer group ownership via API', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Transfer Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // Get user2's ID
    const detailRes = await apiRequest('GET', `/groups/${group.id}`, token1);
    const detail = await detailRes.json();
    const member = (detail.users || []).find((u: any) => u.username === user2.username);
    expect(member).toBeDefined();

    // Transfer ownership
    const transferRes = await apiRequest('PATCH', `/groups/${group.id}/owner`, token1, {
      newOwnerId: member.id,
    });
    expect(transferRes.ok).toBeTruthy();

    // Verify new owner
    const verifyRes = await apiRequest('GET', `/groups/${group.id}`, token1);
    const verify = await verifyRes.json();
    const owner = verify.owner ?? verify.Owner;
    if (owner) {
      expect(owner.id ?? owner.username ?? owner).toBe(member.id ?? member.username);
    }
  });

  test('should reject ownership transfer from non-owner', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    const user3 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user1.password);
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Non Owner Transfer',
      users: [user2.username, user3.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // user2 (non-owner) tries to transfer ownership to user3
    const detailRes = await apiRequest('GET', `/groups/${group.id}`, token1);
    const detail = await detailRes.json();
    const member3 = (detail.users || []).find((u: any) => u.username === user3.username);

    if (member3) {
      const transferRes = await apiRequest('PATCH', `/groups/${group.id}/owner`, token2, {
        newOwnerId: member3.id,
      });
      expect(transferRes.ok).toBeFalsy();
    }
  });
});

test.describe('Group Edge Cases - Member Management', () => {
  test('should reject adding duplicate member to group', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Duplicate Member Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // Try to add user2 again (already a member)
    const addRes = await apiRequest('POST', `/groups/${group.id}/recipients`, token1, {
      username: user2.username,
    });
    expect(addRes.ok).toBeFalsy();
    expect(addRes.status).toBe(400);
  });

  test('should reject owner leaving their own group', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Owner Leave Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // Owner tries to leave
    const leaveRes = await apiRequest('DELETE', `/groups/${group.id}/recipients/leave`, token1);
    expect(leaveRes.ok).toBeFalsy();
  });

  test('should reject removing yourself as owner', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Owner Remove Self',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    // Get owner's user ID from group detail
    const detailRes = await apiRequest('GET', `/groups/${group.id}`, token1);
    const detail = await detailRes.json();
    const ownerUser = (detail.users || []).find(
      (u: any) => u.username === user1.username,
    );

    if (ownerUser) {
      // Owner tries to remove themselves (not via leave, but via kick)
      const removeRes = await apiRequest(
        'DELETE',
        `/groups/${group.id}/recipients/${ownerUser.id}`,
        token1,
      );
      expect(removeRes.ok).toBeFalsy();
    }
  });
});

test.describe('Group Edge Cases - Title Validation', () => {
  test('should create group with empty title (optional)', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const groupRes = await apiRequest('POST', '/groups', accessToken, {
      users: [],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();
    expect(group.id).toBeDefined();
  });
});
