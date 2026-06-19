/**
 * Product sign-off screenshot pack: P24 doc preview, P25 finance, P26 org profile, P27 locale.
 * Prereq: local stack at http://localhost:4200 (admin / admin123, demo seed).
 *
 * Usage (repo root):
 *   node scripts/capture-signoff-screenshots.mjs
 *   node scripts/capture-signoff-screenshots.mjs --only=p24-doc
 *   node scripts/capture-signoff-screenshots.mjs --only=p25
 *   node scripts/capture-signoff-screenshots.mjs --only=p26
 *   node scripts/capture-signoff-screenshots.mjs --only=p27
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'product', 'screenshots');
const BASE = 'http://localhost:4200';
const VIEWPORT = { width: 1280, height: 800 };

const DEMO = {
  productId: '11111111-1111-4111-8111-111111111101',
  poDraftId: '11111111-1111-4111-8111-111111111b02',
  poReceivedId: '11111111-1111-4111-8111-111111111b04',
  soId: '11111111-1111-4111-8111-111111111c01',
  vendorPaymentId: '11111111-1111-4111-8111-111111111b07',
  invoiceId: '11111111-1111-4111-8111-111111111c04',
  journalPostedId: '11111111-1111-4111-8111-111111111606',
};

async function assertStackUp() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error('\nERROR: Cannot reach %s — start: scripts\\start-emcap-local.bat\n', BASE);
    throw err;
  }
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const signIn = page.getByRole('button', { name: 'Sign in' });
  if (await signIn.isVisible().catch(() => false)) {
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await signIn.click();
    await page.waitForURL('**/app**', { timeout: 30_000 });
  }
}

async function waitForShell(page) {
  await page.waitForSelector('app-page-header, .entity-record-page, .settings-tabs', {
    timeout: 45_000,
  });
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function capture(page, filename) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: true });
  console.log('  saved %s', filename);
}

async function openEntityRecord(page, entityCode, recordId) {
  await page.goto(`${BASE}/app/entity/${entityCode}/${recordId}`, { waitUntil: 'networkidle' });
  await waitForShell(page);
}

async function captureDocumentPreview(page) {
  console.log('\nphase24-document-preview-web.png…');
  await openEntityRecord(page, 'PRODUCT', DEMO.productId);

  const documentsTab = page.getByRole('tab', { name: /Documents/i });
  if ((await documentsTab.count()) > 0) {
    await documentsTab.click();
    await page.waitForTimeout(500);
  }

  const docRows = page.locator('.record-tabs__document');
  if ((await docRows.count()) === 0) {
    const uploadBtn = page.locator('.record-tabs__upload button[type="submit"]');
    if ((await uploadBtn.count()) > 0) {
      await uploadBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  const previewBtn = page.locator('.record-tabs__document button').first();
  if ((await previewBtn.count()) === 0) {
    console.warn('WARN: no document to preview — upload may have failed');
    return;
  }
  await previewBtn.click();
  await page.locator('.doc-preview-panel').waitFor({ state: 'visible', timeout: 30_000 });
  await capture(page, 'phase24-document-preview-web.png');
  await page.keyboard.press('Escape').catch(() => {});
}

async function captureEntityWithChildLines(page, entityCode, recordId, filename, sectionHint) {
  console.log('\n%s…', filename);
  await openEntityRecord(page, entityCode, recordId);
  const section = page.locator('app-section-card, app-child-lines-section').filter({
    hasText: sectionHint,
  });
  if ((await section.count()) > 0) {
    await section.first().scrollIntoViewIfNeeded();
  } else {
    await page.locator('.child-lines__table, app-child-lines-section').first().scrollIntoViewIfNeeded().catch(() => {});
  }
  await page.locator('.child-lines__table, app-empty-state, .entity-record-page').first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await capture(page, filename);
}

async function captureP25(page) {
  await captureEntityWithChildLines(
    page,
    'PURCHASE_ORDER',
    DEMO.poDraftId,
    'phase25-purchase-order-detail-web.png',
    /Order lines|PO lines|lines/i,
  );
  await captureEntityWithChildLines(
    page,
    'SALES_ORDER',
    DEMO.soId,
    'phase25-sales-order-detail-web.png',
    /Order lines|lines/i,
  );
  await openEntityRecord(page, 'PURCHASE_ORDER', DEMO.poReceivedId);
  await page.locator('app-child-lines-section').filter({ hasText: /payment|Payment/i }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  await capture(page, 'phase25-vendor-payment-detail-web.png');

  await openEntityRecord(page, 'INVOICE', DEMO.invoiceId);
  await page.locator('app-child-lines-section, .entity-record-page').first().waitFor({ state: 'visible', timeout: 30_000 });
  await capture(page, 'phase25-invoice-partial-web.png');

  await captureEntityWithChildLines(
    page,
    'JOURNAL_ENTRY',
    DEMO.journalPostedId,
    'phase25-journal-entry-detail-web.png',
    /Journal|Entry lines|lines/i,
  );
}

async function openSettingsTab(page, labelPattern) {
  const tab = page.locator('mat-tab-group.settings-tabs .mat-mdc-tab').filter({ hasText: labelPattern });
  await tab.first().waitFor({ state: 'visible', timeout: 30_000 });
  await tab.first().click();
  await page.waitForTimeout(400);
}

async function captureP26(page) {
  console.log('\nphase26-organization-profile-web.png…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.settings-tabs, mat-tab-group', { timeout: 45_000 });

  await openSettingsTab(page, /Identity|Identité|পরিচয়/i);

  const orgPanel = page.locator('mat-expansion-panel').filter({ hasText: /Organization|organisation/i }).first();
  if ((await orgPanel.count()) > 0) {
    const header = orgPanel.locator('mat-expansion-panel-header');
    const expanded = await header.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await header.click();
      await page.waitForTimeout(400);
    }
  }

  await page.locator('input').first().waitFor({ state: 'visible', timeout: 15_000 });
  await capture(page, 'phase26-organization-profile-web.png');
}

async function captureP27(page) {
  console.log('\nphase27-locale-switch-bn-bd-web.png…');
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await waitForShell(page);

  await page.locator('.app-layout__locale').click();
  await page.getByRole('option', { name: /Bengali|bn-BD|বাংলা/i }).click();
  await page.waitForTimeout(800);

  await page.locator('app-page-header, .entity-list-page, app-dynamic-data-grid').first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await capture(page, 'phase27-locale-switch-bn-bd-web.png');
}

const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await assertStackUp();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  try {
    await login(page);

    if (!ONLY || ONLY === 'p24-doc') {
      await captureDocumentPreview(page);
    }
    if (!ONLY || ONLY === 'p25') {
      await captureP25(page);
    }
    if (!ONLY || ONLY === 'p26') {
      await captureP26(page);
    }
    if (!ONLY || ONLY === 'p27') {
      await captureP27(page);
    }

    console.log('\nSign-off captures complete.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
