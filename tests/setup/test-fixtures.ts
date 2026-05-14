import { Page } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  accessToken?: string;
}

let userCounter = 0;

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  userCounter++;
  return {
    username: `e2euser${userCounter}_${Date.now()}`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: `User${userCounter}`,
    ...overrides,
  };
}

export function resetCounters() {
  userCounter = 0;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:80';

export async function registerUserViaAPI(user: TestUser): Promise<TestUser> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: user.username,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Register failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return { ...user, accessToken: data.accessToken };
}

export async function loginViaAPI(
  username: string,
  password: string,
): Promise<{ accessToken: string; setCookie: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie') || '';
  return { accessToken: data.accessToken, setCookie };
}

export async function loginViaUI(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input#username', username);
  await page.fill('input#password', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL('**/conversations**', { timeout: 10000 });
}

export async function setAuthCookies(
  page: Page,
  accessToken: string,
  setCookie: string,
) {
  await page.context().addCookies([
    {
      name: 'refresh_token',
      value: setCookie.match(/refresh_token=([^;]+)/)?.[1] || '',
      domain: new URL(BASE_URL).hostname,
      path: '/api/auth',
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
  // Set access token in localStorage so the frontend picks it up
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('access_token', token);
  }, accessToken);
}

export async function registerAndLogin(page: Page): Promise<TestUser> {
  const user = createTestUser();
  const registered = await registerUserViaAPI(user);
  const { accessToken, setCookie } = await loginViaAPI(
    user.username,
    user.password,
  );
  registered.accessToken = accessToken;
  await setAuthCookies(page, accessToken, setCookie);
  await page.goto('/conversations');
  await page.waitForURL('**/conversations**', { timeout: 10000 });
  return registered;
}
