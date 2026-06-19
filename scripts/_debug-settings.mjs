import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
const signIn = page.getByRole('button', { name: 'Sign in' });
if (await signIn.isVisible().catch(() => false)) {
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin123');
  await signIn.click();
  await page.waitForURL('**/app**', { timeout: 30_000 });
}
page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
await page.goto('http://localhost:4200/app/settings', { waitUntil: 'networkidle' });
await page.waitForTimeout(8000);
console.log('settings-tabs count:', await page.locator('.settings-tabs').count());
console.log('mat-tab-group count:', await page.locator('mat-tab-group').count());
console.log('empty-state count:', await page.locator('app-empty-state').count());
if ((await page.locator('app-empty-state').count()) > 0) {
  console.log('empty-state:', await page.locator('app-empty-state').textContent());
}
await browser.close();
