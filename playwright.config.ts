import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * Auth is handled manually for now (Auth0): run `npm run auth:save`, log in
 * yourself in the browser that opens, and the session is saved to
 * .auth/user.json. Every test reuses that session via storageState.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /* Keep load on the shared dev backend low */
  workers: 2,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'session-check',
      testMatch: /session\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['session-check'],
    },
  ],
});
