/**
 * Phase 30 web Demo+ elevation — W1 quick wins + W2 entity UX captures.
 * Prereq: scripts\start-emcap-local.bat (API :8000, web :4200).
 *
 *   node scripts/capture-web-phase30.mjs --only=w1
 *   node scripts/capture-web-phase30.mjs --only=w2
 *   node scripts/capture-web-phase30.mjs --only=all
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'product', 'screenshots');
const BASE = 'http://localhost:4200';
const API_BASE = 'http://localhost:8000/api/v1';
const VIEWPORT = { width: 1280, height: 800 };

const DEMO = {
  invoiceId: '11111111-1111-4111-8111-111111111c04',
  restoreProductId: '11111111-1111-4111-8111-111111111119',
};

const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1] ?? 'all';

async function assertStackUp() {
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`API health HTTP ${res.status}`);
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const signIn = page.getByRole('button', { name: /Sign in/i });
  if (await signIn.isVisible().catch(() => false)) {
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await signIn.click();
    await page.waitForURL('**/app**', { timeout: 30_000 });
  }
}

async function waitForShell(page) {
  await page.waitForSelector('app-page-header, .entity-record-page, .settings-tabs', { timeout: 45_000 });
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function capture(page, filename) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: true });
  console.log('  saved %s', filename);
}

async function openSettingsTab(page, labelPattern) {
  const tab = page.locator('mat-tab-group.settings-tabs .mat-mdc-tab').filter({ hasText: labelPattern });
  await tab.first().waitFor({ state: 'visible', timeout: 30_000 });
  await tab.first().click();
  await page.waitForTimeout(300);
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

async function restoreProductRecord() {
  await fetch(`${API_BASE}/entities/PRODUCT/records/${DEMO.restoreProductId}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});
}

async function captureW1Branding(page) {
  console.log('\nphase19-settings-branding-web.png (W-T01)…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await openSettingsTab(page, /Integrations|Intégrations|ইন্টিগ্রেশন/i);
  await expandSettingsPanel(page, /Branding|Marque|ব্র্যান্ডিং/i);
  await page.locator('app-branding-preview-panel').waitFor({ state: 'visible', timeout: 30_000 });
  await capture(page, 'phase19-settings-branding-web.png');
}

async function captureW1OrgLogo(page) {
  console.log('\nphase26-organization-logo-web.png (W-T02)…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await openSettingsTab(page, /Identity|Identité|পরিচয়/i);
  await expandSettingsPanel(page, /Organization|organisation/i);
  await page.locator('input[type="file"], button').filter({ hasText: /logo|Logo|upload/i }).first()
    .waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  await page.locator('mat-expansion-panel').filter({ hasText: /Organization|organisation/i }).first()
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await capture(page, 'phase26-organization-logo-web.png');
}

async function captureW1InvoicePrint(page) {
  console.log('\nphase25-invoice-print-web.png (W-T03)…');
  await page.goto(`${BASE}/app/entity/INVOICE/${DEMO.invoiceId}`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const printBtn = page.getByRole('button', { name: /Print invoice|Imprimer/i });
  await printBtn.first().waitFor({ state: 'visible', timeout: 30_000 });
  await printBtn.first().click();
  await page.waitForTimeout(1_200);
  await capture(page, 'phase25-invoice-print-web.png');
}

async function captureW1SoftDeleteRestore(page) {
  console.log('\nphase14-web-soft-delete-restore.png (W-T04)…');
  await restoreProductRecord();
  await page.goto(`${BASE}/app/entity/PRODUCT/${DEMO.restoreProductId}`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const deleteBtn = page.getByRole('button', { name: /^Delete$/i });
  if ((await deleteBtn.count()) > 0) {
    await deleteBtn.first().click();
    await page.waitForTimeout(500);
    const confirm = page.getByRole('button', { name: /^Delete$/i });
    if ((await confirm.count()) > 1) await confirm.last().click();
    else if ((await confirm.count()) === 1) await confirm.first().click();
  }
  await page.getByRole('button', { name: /Restore/i }).first()
    .waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(800);
  await capture(page, 'phase14-web-soft-delete-restore.png');
  await restoreProductRecord();
}

async function captureW2GridLoading(page) {
  console.log('\nphase15-product-grid-loading.png (W-T05)…');
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'domcontentloaded' });
  await page.route(/\/api\/v1\/entities\/PRODUCT\/records(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await new Promise((r) => setTimeout(r, 4_000));
    await route.continue();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('app-loading-panel').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(600);
  await capture(page, 'phase15-product-grid-loading.png');
  await page.unrouteAll();
}

async function captureW2GridErrorRetry(page) {
  console.log('\nphase15-product-grid-error-retry.png (W-T05)…');
  let fail = true;
  await page.route(/\/api\/v1\/metadata\/grids\/PRODUCT(\?.*)?$/, async (route) => {
    if (fail) {
      fail = false;
      await route.fulfill({ status: 500, body: 'capture-induced grid metadata error' });
      return;
    }
    await route.continue();
  });
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Retry/i }).first()
    .waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(600);
  await capture(page, 'phase15-product-grid-error-retry.png');
  await page.unrouteAll();
}

async function captureW2StatusChip(page) {
  console.log('\nphase15-product-detail-hero.png refresh (W-T06 status chip)…');
  await page.goto(`${BASE}/app/entity/PRODUCT/11111111-1111-4111-8111-111111111101`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.locator('.emcap-badge, [role="status"]').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  await capture(page, 'phase15-product-detail-hero.png');
}

async function captureW2PdfExport(page) {
  console.log('\nphase26-pdf-export-org-header-web.png (W-T07)…');
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.getByRole('button', { name: /Export/i }).first().click();
  await page.getByRole('menuitem', { name: /PDF/i }).first().click();
  await page.waitForTimeout(1_500);
  await capture(page, 'phase26-pdf-export-org-header-web.png');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await assertStackUp();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  try {
    await login(page);

    if (ONLY === 'all' || ONLY === 'w1') {
      await captureW1Branding(page);
      await captureW1OrgLogo(page);
      await captureW1InvoicePrint(page);
      await captureW1SoftDeleteRestore(page);
    }
    if (ONLY === 'all' || ONLY === 'w2') {
      await captureW2GridLoading(page);
      await captureW2GridErrorRetry(page);
      await captureW2StatusChip(page);
      await captureW2PdfExport(page);
    }
    console.log('\nPhase 30 web captures complete.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
