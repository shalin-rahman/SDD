/**
 * M1 PRODUCT web screenshot pack (P15-T06 / P20-T02).
 * Prereq: local stack at http://localhost:4200 (admin / admin123).
 *
 * Usage (repo root):
 *   npx --yes playwright@1.49.1 install chromium
 *   node scripts/capture-m1-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'product', 'screenshots');
const BASE = 'http://localhost:4200';
const VIEWPORT = { width: 1280, height: 800 };

const SHOTS = [
  'phase15-product-grid-polish.png',
  'phase14-product-grid-system-columns.png',
  'phase15-product-detail-hero.png',
  'phase14-product-detail-system-card.png',
  'phase15-product-detail-hero-dark.png',
];

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

async function openProductEntity(page) {
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.data-grid__table tr.row-selected, .data-grid__table tbody tr, .data-grid__table tr', {
    timeout: 45_000,
  });
  const rows = page.locator('.data-grid__table tr').filter({ has: page.locator('td') });
  await rows.first().waitFor({ state: 'visible', timeout: 30_000 });
  const count = await rows.count();
  if (count < 2) {
    throw new Error(`Expected seeded PRODUCT rows in grid; found ${count}`);
  }
}

async function selectDemoProduct(page) {
  const dataRow = page.locator('.data-grid__table tr').filter({ has: page.locator('td') }).first();
  await dataRow.scrollIntoViewIfNeeded();
  await dataRow.click();
  await page.waitForURL(/\/app\/entity\/PRODUCT\/[^/]+$/, { timeout: 30_000 });
  await page.waitForSelector('.record-header__title', { timeout: 30_000 });
  const title = await page.locator('.record-header__title').textContent();
  if (!title?.trim()) {
    throw new Error('Record detail header did not populate after row select');
  }
}

async function captureGridSystemColumns(page) {
  const scroll = page.locator('.entity-list-page__grid .data-grid__scroll');
  const createdHeader = page.locator('.data-grid__table th').filter({ hasText: /created/i }).first();
  if (await createdHeader.count()) {
    await createdHeader.scrollIntoViewIfNeeded();
  } else {
    await scroll.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
  }
  await page.waitForTimeout(200);
  await capture(page, SHOTS[1]);
}

async function assertUxChecklist(page) {
  const headline = page.locator('.record-header__title');
  await headline.waitFor({ state: 'visible' });
  const text = (await headline.textContent())?.trim() ?? '';
  if (!text.includes('—') && !text.includes('-')) {
    console.warn(`WARN: hero may not show SKU — Name pattern: "${text}"`);
  }
  const chip = page.locator('app-record-detail-header mat-chip');
  if ((await chip.count()) === 0) {
    console.warn('WARN: status chip not visible on selected record');
  }
  const saveInHeader = page.locator('app-record-detail-header button').filter({ hasText: /save|create/i });
  if ((await saveInHeader.count()) === 0) {
    throw new Error('UX checklist: header action bar missing Save');
  }
  const footerSave = page.locator('.dynamic-form__footer button');
  if ((await footerSave.count()) > 0) {
    throw new Error('UX checklist: duplicate Save at form footer');
  }
}

async function capture(page, filename, options = {}) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, ...options });
  console.log(`  wrote ${filename}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  try {
    console.log('Login…');
    await login(page);

    console.log('Open PRODUCT entity…');
    await openProductEntity(page);

    console.log('Grid screenshots…');
    await capture(page, SHOTS[0]);
    await captureGridSystemColumns(page);

    console.log('Select demo row…');
    await selectDemoProduct(page);
    await assertUxChecklist(page);

    console.log('Detail screenshots…');
    await capture(page, SHOTS[2]);

    const systemCard = page.locator('.form-section--system');
    await systemCard.scrollIntoViewIfNeeded();
    if (!(await systemCard.isVisible())) {
      throw new Error('System section card not visible on PRODUCT detail');
    }
    await systemCard.screenshot({ path: path.join(OUT_DIR, SHOTS[3]) });
    console.log(`  wrote ${SHOTS[3]}`);

    console.log('Dark theme detail…');
    await page.locator('button[aria-label*="theme" i], button[aria-label*="Theme" i]').first().click();
    await page.waitForTimeout(400);
    await page.locator('app-record-detail-header').scrollIntoViewIfNeeded();
    await capture(page, SHOTS[4]);

    console.log('\nM1 pack complete:');
    for (const name of SHOTS) {
      console.log(`  docs/product/screenshots/${name}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
