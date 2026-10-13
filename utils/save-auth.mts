// Opens a real browser so you can log in to Dashboard v2 yourself (Auth0),
// then saves the session to .auth/user.json for the tests to reuse.
// Usage: npm run auth:save
import 'dotenv/config';
import { chromium } from '@playwright/test';
import { createInterface } from 'node:readline/promises';

async function main() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) throw new Error('Set BASE_URL in .env first (see .env.example).');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(baseUrl);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question('Log in in the browser window, wait for the dashboard to load, then press Enter here... ');
  rl.close();

  await context.storageState({ path: '.auth/user.json' });
  console.log('Session saved to .auth/user.json');
  await browser.close();
}

main();
