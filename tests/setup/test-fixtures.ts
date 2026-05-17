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
  const shortId = Date.now().toString(36).slice(-5);
  return {
    username: `u${shortId}${userCounter}`,
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

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 6): Promise<T> {
  let lastError: Error = new Error('Max retry attempts exceeded');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (i < maxAttempts - 1 && err.message?.includes('429')) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function registerUserViaAPI(user: TestUser): Promise<TestUser> {
  return withRetry(async () => {
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
  });
}

export async function loginViaAPI(
  username: string,
  password: string,
): Promise<{ accessToken: string; setCookie: string }> {
  return withRetry(async () => {
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
  });
}

export async function loginViaUI(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input#username', username);
  await page.fill('input#password', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL('**/conversations**', { timeout: 15000 });
}

/** Authenticated fetch wrapper — avoids copy-pasting auth headers in every test */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token: string,
  body?: object,
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  return fetch(`${BASE_URL}/api${path}`, options);
}

/** Register via API, login via UI, return user + access token for subsequent API calls */
export async function setupAuthenticatedPage(
  page: Page,
): Promise<TestUser & { accessToken: string }> {
  const user = createTestUser();
  await registerUserViaAPI(user);
  const { accessToken } = await loginViaAPI(user.username, user.password);
  await loginViaUI(page, user.username, user.password);
  return { ...user, accessToken };
}

export async function registerAndLogin(page: Page): Promise<TestUser> {
  const user = createTestUser();
  await registerUserViaAPI(user);
  await loginViaUI(page, user.username, user.password);
  return user;
}
