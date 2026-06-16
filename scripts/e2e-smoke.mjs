/**
 * P18-T14 — Playwright E2E smoke against a running local stack.
 *
 * Flow: login → PRODUCT list + read + create → settings save → LEAD list (CRM).
 *
 * Prereq:
 *   API  http://localhost:8000  (seeded admin / admin123)
 *   Web  http://localhost:4200  (ng serve)
 *
 * Usage (repo root):
 *   npx --yes playwright@1.49.1 install chromium
 *   node scripts/e2e-smoke.mjs
 *
 * Env: EMCAP_WEB_URL, EMCAP_API_URL (defaults above).
 */
import { chromium } from 'playwright';

const WEB = process.env.EMCAP_WEB_URL ?? 'http://localhost:4200';
const API = process.env.EMCAP_API_URL ?? 'http://localhost:8000';

async function assertStackUp() {
  const health = await fetch(`${API}/api/v1/health`, { signal: AbortSignal.timeout(8_000) });
  if (!health.ok) {
    throw new Error(`API health failed: HTTP ${health.status}`);
  }
  const web = await fetch(WEB, { signal: AbortSignal.timeout(8_000) });
  if (!web.ok) {
    throw new Error(`Web shell failed: HTTP ${web.status}`);
  }
}

async function login(page) {
  await page.goto(WEB, { waitUntil: 'networkidle' });
  const signIn = page.getByRole('button', { name: /Sign in|Se connecter|সাইন ইন/i });
  if (await signIn.isVisible().catch(() => false)) {
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await signIn.click();
    await page.waitForURL('**/app**', { timeout: 30_000 });
  }
}

async function waitForShell(page) {
  await page.waitForSelector('app-page-header, .entity-list-page, .settings-tabs', {
    timeout: 45_000,
  });
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
}

async function smokeProductCrud(page) {
  await page.goto(`${WEB}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const dataRows = page.locator('.data-grid__table tr.data-grid__row');
  await dataRows.first().waitFor({ state: 'visible', timeout: 30_000 });
  const rowCount = await dataRows.count();
  if (rowCount < 1) {
    throw new Error(`PRODUCT list: expected seeded rows, found ${rowCount}`);
  }

  await dataRows.first().click();
  await page.waitForURL(/\/app\/entity\/PRODUCT\/[^/]+$/, { timeout: 30_000 });
  await page.waitForSelector('app-record-detail-header, app-dynamic-form-view', { timeout: 30_000 });

  const sku = `E2E-${Date.now()}`;
  await page.goto(`${WEB}/app/entity/PRODUCT/new`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.getByLabel(/^SKU/i).fill(sku);
  await page.getByLabel(/^Name/i).fill(`Smoke ${sku}`);
  await page.getByRole('button', { name: /Create record|Save|Créer|সংরক্ষণ/i }).click();
  await page.waitForURL(/\/app\/entity\/PRODUCT\/[^/]+$/, { timeout: 45_000 });
  await page.waitForSelector('app-record-detail-header', { timeout: 30_000 });
}

async function smokeSettingsSave(page) {
  await page.goto(`${WEB}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.settings-tabs', { timeout: 30_000 });
  await page.getByRole('button', { name: /Save changes|Enregistrer|সংরক্ষণ/i }).click();
  await page.waitForSelector('.status', { timeout: 30_000 });
  const status = await page.locator('.status').first().textContent();
  if (!status || !/saved|enregistr|সংরক্ষিত/i.test(status)) {
    throw new Error(`Settings save: unexpected status "${status ?? ''}"`);
  }
}

async function smokeCrmLeadList(page) {
  await page.goto(`${WEB}/app/entity/LEAD`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const empty = page.locator('app-empty-state');
  const rows = page.locator('.data-grid__table tr.data-grid__row');
  if ((await rows.count()) === 0 && !(await empty.isVisible().catch(() => false))) {
    throw new Error('LEAD list: expected grid rows or empty state');
  }
}

async function main() {
  console.log(`E2E smoke — web ${WEB}, api ${API}`);
  await assertStackUp();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await login(page);
    await smokeProductCrud(page);
    await smokeSettingsSave(page);
    await smokeCrmLeadList(page);
    console.log('E2E smoke passed.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
