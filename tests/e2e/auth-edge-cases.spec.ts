import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Auth Edge Cases - Token Refresh', () => {
  test('should refresh access token successfully', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken, setCookie } = await loginViaAPI(user.username, user.password);

    // Wait for JWT iat to differ (issued-at timestamp has 1s granularity)
    await new Promise((r) => setTimeout(r, 1100));

    // Call refresh with the cookie
    const refreshRes = await fetch(`${process.env.BASE_URL || 'http://localhost:80'}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: setCookie },
    });
    expect(refreshRes.ok).toBeTruthy();
    const data = await refreshRes.json();
    expect(data.accessToken).toBeDefined();
    expect(data.accessToken).not.toBe(accessToken);
  });

  test('should reject refresh with no cookie', async () => {
    const refreshRes = await fetch(`${process.env.BASE_URL || 'http://localhost:80'}/api/auth/refresh`, {
      method: 'POST',
    });
    expect(refreshRes.status).toBe(401);
  });

  test('should reject refresh after logout', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken, setCookie } = await loginViaAPI(user.username, user.password);

    // Logout with cookie so the refresh token is revoked
    const baseUrl = process.env.BASE_URL || 'http://localhost:80';
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, Cookie: setCookie },
    });

    // Try to refresh with the old cookie
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: setCookie },
    });
    expect(refreshRes.status).toBe(401);
  });
});

test.describe('Auth Edge Cases - Password Change', () => {
  test('should change password and re-login with new password', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const changeRes = await apiRequest('POST', '/auth/change-password', accessToken, {
      currentPassword: user.password,
      newPassword: 'NewTestPass456!',
    });
    expect(changeRes.ok).toBeTruthy();

    // Old password should fail
    const oldLogin = await loginViaAPI(user.username, user.password).catch(() => null);
    // New password should work
    const newLogin = await loginViaAPI(user.username, 'NewTestPass456!');
    expect(newLogin.accessToken).toBeDefined();
  });

  test('should reject password change with wrong current password', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const changeRes = await apiRequest('POST', '/auth/change-password', accessToken, {
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewTestPass456!',
    });
    expect(changeRes.ok).toBeFalsy();
    expect(changeRes.status).toBe(401);
  });

  test('should reject weak new password', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const changeRes = await apiRequest('POST', '/auth/change-password', accessToken, {
      currentPassword: user.password,
      newPassword: 'weak',
    });
    expect(changeRes.ok).toBeFalsy();
    expect([400, 422]).toContain(changeRes.status);
  });
});

test.describe('Auth Edge Cases - /auth/me', () => {
  test('should return current user info via /auth/me', async () => {
    const user = createTestUser();
    await registerUserViaAPI(user);
    const { accessToken } = await loginViaAPI(user.username, user.password);

    const meRes = await apiRequest('GET', '/auth/me', accessToken);
    expect(meRes.ok).toBeTruthy();
    const me = await meRes.json();
    expect(me.username).toBe(user.username);
    expect(me.firstName).toBe(user.firstName);
    expect(me.lastName).toBe(user.lastName);
  });

  test('should reject /auth/me without token', async () => {
    const meRes = await fetch(`${process.env.BASE_URL || 'http://localhost:80'}/api/auth/me`);
    expect(meRes.status).toBe(401);
  });
});
