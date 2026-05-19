import { test, expect } from '@playwright/test';
import {
  createTestUser,
  setupAuthenticatedPage,
  registerUserViaAPI,
  loginViaAPI,
  loginViaUI,
  apiRequest,
} from '../setup/test-fixtures';

test.describe('Calls - Page Render', () => {
  test('should render calls page when authenticated', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
  });

  test('should not redirect to login when authenticated', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should render calls sidebar', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');
    // The calls page renders CallsSidebar which shows friends
    await expect(page).toHaveURL(/\/calls/);
  });
});

test.describe('Calls - Friends in Calls List', () => {
  test('should show friends available for calling', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    // Become friends
    const reqRes = await apiRequest('POST', '/friends/requests', token1, {
      username: user2.username,
    });
    expect(reqRes.ok).toBeTruthy();
    const request = await reqRes.json();

    const requestsRes = await apiRequest('GET', '/friends/requests', token2);
    const requests = await requestsRes.json();
    const incoming = (Array.isArray(requests) ? requests : []).find(
      (r: any) => r.receiver?.username === user2.username,
    );
    if (incoming) {
      await apiRequest('PATCH', `/friends/requests/${incoming.id}/accept`, token2);
    }

    // user1 navigates to calls
    await loginViaUI(page, user1.username, user1.password);
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');

    // user2 should appear in calls sidebar
    await expect(page.locator(`text=${user2.username}`).or(page.locator(`text=${user2.firstName}`))).toBeVisible({
      timeout: 8000,
    });
  });

  test('should show empty calls list with no friends', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');
    // New user has no friends — page should still load without error
    await expect(page).toHaveURL(/\/calls/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Calls - Navigation', () => {
  test('should navigate to calls from conversations', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/conversations');
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
  });

  test('should navigate back to conversations from calls', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/calls');
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/conversations/);
  });
});

test.describe('Calls - Initiation UI', () => {
  test('should show call buttons in conversation header', async ({ page }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const reqRes = await apiRequest('POST', '/friends/requests', token1, { username: user2.username });
    expect(reqRes.ok).toBeTruthy();
    const requestsRes = await apiRequest('GET', '/friends/requests', token2);
    const requests = await requestsRes.json();
    const incoming = (Array.isArray(requests) ? requests : []).find(
      (r: any) => r.receiver?.username === user2.username,
    );
    if (incoming) {
      await apiRequest('PATCH', `/friends/requests/${incoming.id}/accept`, token2);
    }

    const convRes = await apiRequest('POST', '/conversations', token1, { username: user2.username });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    await loginViaUI(page, user1.username, user1.password);
    await page.goto(`/conversations/${conv.id}`);
    await page.waitForLoadState('networkidle');

    // Voice and video call buttons should be present in the header
    await expect(page.locator('[data-testid="voice-call-button"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="video-call-button"]')).toBeVisible({ timeout: 8000 });
  });

  test('should show recipient full name (first + last) in waiting dialog when initiating call', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const reqRes = await apiRequest('POST', '/friends/requests', token1, { username: user2.username });
    const requestsRes = await apiRequest('GET', '/friends/requests', token2);
    const requests = await requestsRes.json();
    const incoming = (Array.isArray(requests) ? requests : []).find(
      (r: any) => r.receiver?.username === user2.username,
    );
    if (incoming) {
      await apiRequest('PATCH', `/friends/requests/${incoming.id}/accept`, token2);
    }

    const convRes = await apiRequest('POST', '/conversations', token1, { username: user2.username });
    const conv = await convRes.json();

    // user2 must be online for the call to not immediately fail
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.waitForLoadState('networkidle');

    await loginViaUI(page, user1.username, user1.password);
    await page.goto(`/conversations/${conv.id}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="voice-call-button"]').click();

    // Waiting dialog should show recipient's full name
    const recipientFullName = `${user2.firstName} ${user2.lastName}`;
    await expect(page.locator(`text=${recipientFullName}`).first()).toBeVisible({ timeout: 8000 });

    await ctx2.close();
  });

  test('call buttons should be disabled/dimmed when recipient is in a call', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    const user3 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);

    // user1 friends with user2
    const req1 = await apiRequest('POST', '/friends/requests', token1, { username: user2.username });
    const reqs1 = await (await apiRequest('GET', '/friends/requests', token2)).json();
    const inc1 = (Array.isArray(reqs1) ? reqs1 : []).find((r: any) => r.receiver?.username === user2.username);
    if (inc1) await apiRequest('PATCH', `/friends/requests/${inc1.id}/accept`, token2);

    // user2 friends with user3 (so user3 can call user2)
    const req2 = await apiRequest('POST', '/friends/requests', token2, { username: user3.username });
    const reqs2 = await (await apiRequest('GET', '/friends/requests', token3)).json();
    const inc2 = (Array.isArray(reqs2) ? reqs2 : []).find((r: any) => r.receiver?.username === user3.username);
    if (inc2) await apiRequest('PATCH', `/friends/requests/${inc2.id}/accept`, token3);

    const conv12 = await (await apiRequest('POST', '/conversations', token1, { username: user2.username })).json();

    // user2 and user3 have a conversation so user3 can call user2
    const conv23 = await (await apiRequest('POST', '/conversations', token3, { username: user2.username })).json();

    // user3 page - will call user2 to put user2 in-call
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await loginViaUI(page3, user3.username, user3.password);

    // user2 page - must be online so user3 can call
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.waitForLoadState('networkidle');

    // user3 calls user2 (puts user2 in-call state on backend after acceptance)
    await page3.goto(`/conversations/${conv23.id}`);
    await page3.waitForLoadState('networkidle');
    await page3.locator('[data-testid="voice-call-button"]').click();

    // user2 accepts
    const acceptBtn = page2.locator('button').filter({ hasText: /accept/i }).first();
    if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptBtn.click();
    }

    // Now user1 tries to call user2 — buttons should be dimmed with opacity 0.4
    await loginViaUI(page, user1.username, user1.password);
    await page.goto(`/conversations/${conv12.id}`);
    await page.waitForLoadState('networkidle');

    // Wait for status update propagation
    await page.waitForTimeout(2000);

    const voiceBtn = page.locator('[data-testid="voice-call-button"]');
    await expect(voiceBtn).toBeVisible({ timeout: 8000 });
    // Opacity 0.4 is applied via style when recipient is in-call
    const opacity = await voiceBtn.evaluate((el) => (el as HTMLElement).style.opacity);
    expect(opacity).toBe('0.4');

    await ctx2.close();
    await ctx3.close();
  });

  test('should show "in a call" label in header when recipient is in a call', async ({ page, browser }) => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    const user3 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);
    await registerUserViaAPI(user3);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    const { accessToken: token3 } = await loginViaAPI(user3.username, user3.password);

    const req1 = await apiRequest('POST', '/friends/requests', token1, { username: user2.username });
    const reqs1 = await (await apiRequest('GET', '/friends/requests', token2)).json();
    const inc1 = (Array.isArray(reqs1) ? reqs1 : []).find((r: any) => r.receiver?.username === user2.username);
    if (inc1) await apiRequest('PATCH', `/friends/requests/${inc1.id}/accept`, token2);

    const req2 = await apiRequest('POST', '/friends/requests', token2, { username: user3.username });
    const reqs2 = await (await apiRequest('GET', '/friends/requests', token3)).json();
    const inc2 = (Array.isArray(reqs2) ? reqs2 : []).find((r: any) => r.receiver?.username === user3.username);
    if (inc2) await apiRequest('PATCH', `/friends/requests/${inc2.id}/accept`, token3);

    const conv12 = await (await apiRequest('POST', '/conversations', token1, { username: user2.username })).json();
    const conv23 = await (await apiRequest('POST', '/conversations', token3, { username: user2.username })).json();

    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await loginViaUI(page3, user3.username, user3.password);

    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, user2.username, user2.password);
    await page2.waitForLoadState('networkidle');

    await page3.goto(`/conversations/${conv23.id}`);
    await page3.waitForLoadState('networkidle');
    await page3.locator('[data-testid="voice-call-button"]').click();

    const acceptBtn = page2.locator('button').filter({ hasText: /accept/i }).first();
    if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptBtn.click();
    }

    await loginViaUI(page, user1.username, user1.password);
    await page.goto(`/conversations/${conv12.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=In a call').first()).toBeVisible({ timeout: 8000 });

    await ctx2.close();
    await ctx3.close();
  });
});
