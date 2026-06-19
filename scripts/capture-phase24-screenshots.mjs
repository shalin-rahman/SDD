/**
 * Phase 24 web screenshot pack (P24-T01 document preview, P24-T02 movement lines).
 * Prereq: local stack at http://localhost:4200 (admin / admin123, demo seed).
 *
 * Usage (repo root):
 *   npx --yes playwright@1.49.1 install chromium
 *   node scripts/capture-phase24-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'product', 'screenshots');
const BASE = 'http://localhost:4200';
const VIEWPORT = { width: 1280, height: 800 };

/** Demo seed movement with lines (SM-DEMO-DRF-R01). */
const DRAFT_MOVEMENT_ID = '11111111-1111-4111-8111-111111111801';
/** Demo seed product for document preview (SKU-DEMO-001). */
const DEMO_PRODUCT_ID = '11111111-1111-4111-8111-111111111101';

async function assertStackUp() {
  let res;
  try {
    res = await fetch(BASE, { signal: AbortSignal.timeout(8_000) });
  } catch (err) {
    console.error(
      '\nERROR: Cannot reach %s — start the stack first:\n  scripts\\start-emcap-local.bat\n',
      BASE,
    );
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Stack at ${BASE} returned HTTP ${res.status}`);
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
  await page.waitForSelector('app-page-header, .entity-record-page', { timeout: 45_000 });
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function capture(page, filename) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: true });
  console.log('  saved %s', filename);
}

async function captureMovementLines(page) {
  console.log('phase24-stock-movement-lines-web.png…');
  await page.goto(`${BASE}/app/entity/STOCK_MOVEMENT/${DRAFT_MOVEMENT_ID}`, {
    waitUntil: 'networkidle',
  });
  await waitForShell(page);
  await page.locator('.child-lines__table, app-empty-state').first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.locator('app-section-card').filter({ hasText: 'Movement lines' }).scrollIntoViewIfNeeded();
  await capture(page, 'phase24-stock-movement-lines-web.png');
}

async function captureDocumentPreview(page) {
  console.log('phase24-document-preview-web.png…');
  await page.goto(`${BASE}/app/entity/PRODUCT/${DEMO_PRODUCT_ID}`, {
    waitUntil: 'networkidle',
  });
  await waitForShell(page);

  const documentsTab = page.getByRole('tab', { name: /Documents/i });
  if ((await documentsTab.count()) > 0) {
    await documentsTab.click();
    await page.waitForTimeout(400);
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
    console.warn('WARN: no document to preview — upload may be required');
    return;
  }
  await previewBtn.click();
  await page.locator('.doc-preview-panel').waitFor({ state: 'visible', timeout: 30_000 });
  await capture(page, 'phase24-document-preview-web.png');
  await page.keyboard.press('Escape').catch(() => {});
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await assertStackUp();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });
  try {
    await login(page);
    await captureMovementLines(page);
    await captureDocumentPreview(page);
    console.log('\nPhase 24 captures complete.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
