// Read-only page inspector: opens a page with the saved session, then prints
// its accessibility tree, data-testids and the API calls it makes on load.
// Usage: node utils/inspect-page.mts /dashboard [outDir]
import 'dotenv/config';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const path = process.argv[2] ?? '/';
  const outDir = process.argv[3] ?? 'inspect-output';
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL,
    storageState: '.auth/user.json',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const apiCalls: { method: string; url: string; status: number; body: string }[] = [];
  page.on('response', async (res) => {
    const type = res.request().resourceType();
    if (type !== 'xhr' && type !== 'fetch') return;
    let body = '';
    try { body = (await res.text()).slice(0, 3000); } catch {}
    apiCalls.push({ method: res.request().method(), url: res.url(), status: res.status(), body });
  });

  await page.goto(path);
  await page.waitForLoadState('networkidle');

  const testIds = await page.locator('[data-testid]').evaluateAll((els) =>
    els.map((el) => `${el.getAttribute('data-testid')}  <${el.tagName.toLowerCase()}>`),
  );

  writeFileSync(join(outDir, 'url.txt'), page.url());
  writeFileSync(join(outDir, 'aria.yml'), await page.locator('body').ariaSnapshot());
  writeFileSync(join(outDir, 'testids.txt'), testIds.join('\n'));
  writeFileSync(join(outDir, 'api.json'), JSON.stringify(apiCalls, null, 2));
  await page.screenshot({ path: join(outDir, 'page.png'), fullPage: true });

  console.log(`Final URL: ${page.url()}`);
  console.log(`data-testids: ${testIds.length}, API calls: ${apiCalls.length}`);
  await browser.close();
}

main();
