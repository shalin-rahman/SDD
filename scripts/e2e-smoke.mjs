/**
 * P18-T14 — Playwright E2E smoke against a running local stack.
 *
 * Flow: login → PRODUCT list + read + create + bulk delete → settings save →
 *       report schedule save → admin users → LEAD list (CRM).
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

  return sku;
}

async function smokeBulkDelete(page, sku) {
  await page.goto(`${WEB}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const bulkToolbar = page.locator('.data-grid__bulk');
  const row = page.locator('.data-grid__table tr.data-grid__row').filter({ hasText: sku }).first();
  if ((await row.count()) === 0) {
    console.warn(`WARN: bulk delete skipped — row ${sku} not found`);
    return;
  }
  const checkbox = row.locator('input[type="checkbox"]');
  if ((await checkbox.count()) === 0) {
    throw new Error('PRODUCT grid: bulk checkbox column missing (bulk_actions metadata?)');
  }
  await checkbox.check();
  await bulkToolbar.waitFor({ state: 'visible', timeout: 10_000 });
  page.once('dialog', (dialog) => dialog.accept());
  await bulkToolbar.getByRole('button', { name: /Delete selected|Supprimer|মুছুন/i }).click();
  await page.waitForTimeout(1500);
  if ((await row.count()) > 0 && (await row.isVisible())) {
    throw new Error(`Bulk delete: row ${sku} still visible`);
  }
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

async function openSettingsTab(page, labelPattern) {
  const tab = page.locator('mat-tab-group.settings-tabs .mat-mdc-tab').filter({ hasText: labelPattern });
  await tab.first().waitFor({ state: 'visible', timeout: 30_000 });
  await tab.first().click();
  await page.waitForTimeout(250);
}

async function expandSettingsPanel(page, titlePattern) {
  const header = page.locator('mat-expansion-panel-header').filter({ hasText: titlePattern });
  await header.first().waitFor({ state: 'visible', timeout: 30_000 });
  const panel = header.first().locator('xpath=ancestor::mat-expansion-panel[1]');
  const expanded = await panel.getAttribute('class');
  if (!expanded?.includes('mat-expanded')) {
    await header.first().click();
    await page.waitForTimeout(300);
  }
}

async function smokeReportScheduleSave(page) {
  await page.goto(`${WEB}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await openSettingsTab(page, /Platform|Plateforme|প্ল্যাটফর্ম/i);
  await expandSettingsPanel(page, /Reports|Rapports|রিপোর্ট/i);
  const cronInput = page.locator('.settings-report-schedules .settings-cron-input').first();
  if ((await cronInput.count()) === 0) {
    console.warn('WARN: report schedule table empty — skipping cron save');
    return;
  }
  await cronInput.fill('0 9 * * *');
  await page
    .locator('.settings-report-schedules')
    .getByRole('button', { name: /Save|Enregistrer|সংরক্ষণ/i })
    .first()
    .click();
  await page.waitForSelector('.settings-status', { timeout: 30_000 });
  const status = await page.locator('.settings-status').first().textContent();
  if (!status || !/saved|enregistr|সংরক্ষিত|schedule/i.test(status)) {
    throw new Error(`Report schedule save: unexpected status "${status ?? ''}"`);
  }
}

async function smokeAdminUsers(page) {
  await page.goto(`${WEB}/app/admin/users`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const table = page.locator('.admin-table tbody tr');
  const empty = page.locator('app-empty-state');
  if ((await table.count()) === 0 && !(await empty.isVisible().catch(() => false))) {
    throw new Error('Admin users: expected table rows or empty state');
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
    const sku = await smokeProductCrud(page);
    await smokeBulkDelete(page, sku);
    await smokeSettingsSave(page);
    await smokeReportScheduleSave(page);
    await smokeAdminUsers(page);
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
