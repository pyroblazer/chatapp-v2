import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '90%' : 8,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 45000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:80',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI
      ? 'docker compose up --build -d'
      : 'echo "Using existing server"',
    url: 'http://localhost:80',
    reuseExistingServer: true,
    timeout: 300000,
  },
});
