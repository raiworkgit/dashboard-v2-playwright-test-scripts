import { test as setup, expect } from '@playwright/test';

// Runs before all tests. Login is done manually (`npm run auth:save`), and the
// session expires after a server-side time limit or when the account logs in
// elsewhere, so check it once up front instead of failing every test.
setup('saved session is still valid', async ({ page }) => {
  const [response] = await Promise.all([
    page.waitForResponse((r) => new URL(r.url()).pathname === '/api/dashboard/global'),
    page.goto('/dashboard'),
  ]);
  expect(
    response.status(),
    'Saved session expired or was replaced by a login elsewhere. Run `npm run auth:save` and log in again.',
  ).toBe(200);
});
