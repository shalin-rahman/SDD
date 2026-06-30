/**
 * Mobile Product-ready PNG pack — Flutter web at phone viewport (390×844).
 * Prereq: API on :8000 with demo seed (`scripts\start-emcap-local.bat`).
 *
 * Usage (repo root, after `flutter build web` in clients/mobile):
 *   node scripts/capture-mobile-signoff-screenshots.mjs
 *   node scripts/capture-mobile-signoff-screenshots.mjs --only=m2
 *   node scripts/capture-mobile-signoff-screenshots.mjs --only=p17
 *   node scripts/capture-mobile-signoff-screenshots.mjs --only=doc
 *   node scripts/capture-mobile-signoff-screenshots.mjs --only=p17-platform
 */
import { chromium } from 'playwright';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOBILE_DIR = path.join(ROOT, 'clients', 'mobile');
const WEB_BUILD = path.join(MOBILE_DIR, 'build', 'web');
const OUT_DIR = path.join(ROOT, 'docs', 'product', 'screenshots');
const API_BASE = 'http://localhost:8000/api/v1';
/** Demo seed product used for document preview (SKU-TOOL-8001). */
const DEMO_PRODUCT_RECORD_ID = '11111111-1111-4111-8111-111111111120';
/** Soft-delete restore capture target (SKU-PKG-7002). */
const RESTORE_PRODUCT_RECORD_ID = '11111111-1111-4111-8111-111111111119';
/** Demo seed movement with lines (SM-DEMO-DRF-R01). */
const DEMO_STOCK_MOVEMENT_ID = '11111111-1111-4111-8111-111111111801';

async function restoreProductRecord() {
  const res = await fetch(`${API_BASE}/entities/PRODUCT/records/${RESTORE_PRODUCT_RECORD_ID}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok && res.status !== 404) {
    console.warn('WARN: restore seed product failed: HTTP %s', res.status);
  }
}

async function seedProductDocument() {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity_code: 'PRODUCT',
      record_id: DEMO_PRODUCT_RECORD_ID,
      filename: 'demo-spec.txt',
      content: 'Demo product specification for mobile preview.',
    }),
  });
  if (!res.ok) {
    throw new Error(`Document seed failed: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const API_HEALTH = `${API_BASE}/health`;
const WEB_PORT = Number(process.env.EMCAP_MOBILE_WEB_PORT ?? 5053);
const BASE = `http://127.0.0.1:${WEB_PORT}`;
const VIEWPORT = { width: 390, height: 844 };

const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1] ?? 'all';

const CHROME_ARGS = ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'];

async function assertApiUp() {
  const res = await fetch(API_HEALTH, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

async function ensureStaticWebServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
      const filePath = path.join(WEB_BUILD, rel);
      if (!filePath.startsWith(WEB_BUILD)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const data = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(WEB_PORT, '127.0.0.1', resolve);
    });
    return server;
  } catch (err) {
    if (err?.code === 'EADDRINUSE') {
      console.log('Port %s already in use � reusing existing static server.', WEB_PORT);
      await waitForUrl(BASE);
      return null;
    }
    throw err;
  }
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`URL not ready: ${url}`);
}

async function capture(page, filename) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: true });
  console.log('  saved %s', filename);
}

async function enableFlutterAccessibility(page) {
  await page.evaluate(() => {
    document.querySelector('[aria-label="Enable accessibility"]')?.click();
  });
  await page.waitForTimeout(600);
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForTimeout(6_000);
  await enableFlutterAccessibility(page);

  const signIn = page.getByRole('button', { name: /Sign in/i });
  if ((await signIn.count()) > 0) {
    await signIn.click({ force: true });
  }
  await page.waitForTimeout(15_000);
  await enableFlutterAccessibility(page);

  const navReady = page.getByRole('button', { name: /Workflow|Products|Purchase|Settings/i }).first();
  await navReady.waitFor({ state: 'attached', timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(2_000);
}

async function goBackToShell(page) {
  for (let i = 0; i < 6; i += 1) {
    await enableFlutterAccessibility(page);
    const back = page.getByRole('button', { name: /^Back$/i });
    if ((await back.count()) === 0) return;
    await back.first().click({ force: true });
    await page.waitForTimeout(1_500);
  }
}

async function openDrawer(page) {
  await enableFlutterAccessibility(page);
  const menu = page.locator('[aria-label*="menu" i], [aria-label*="navigation" i]').first();
  if ((await menu.count()) > 0) {
    await menu.click({ force: true });
  } else {
    await page.mouse.click(24, 48);
  }
  await page.waitForTimeout(1_000);
}

async function tapPlatformNav(page, label) {
  await enableFlutterAccessibility(page);
  for (let i = 0; i < 24; i += 1) {
    for (const locator of [
      page.getByRole('button', { name: label, exact: true }),
      page.getByText(label, { exact: true }),
    ]) {
      if ((await locator.count()) > 0) {
        await locator.first().click({ force: true });
        await page.waitForTimeout(4_000);
        return;
      }
    }
    await page.mouse.move(120, 400);
    await page.mouse.wheel(0, 180);
    await page.waitForTimeout(220);
  }
  throw new Error(`Platform nav not found: ${label}`);
}

async function tapNav(page, label) {
  await enableFlutterAccessibility(page);
  for (let i = 0; i < 40; i += 1) {
    for (const locator of [
      page.getByRole('button', { name: label, exact: true }),
      page.getByRole('menuitem', { name: label, exact: true }),
      page.getByText(label, { exact: true }),
    ]) {
      if ((await locator.count()) > 0) {
        try {
          await locator.first().click({ force: true, timeout: 2_000 });
          await page.waitForTimeout(4_000);
          return;
        } catch {
          // try next locator / scroll
        }
      }
    }
    await page.mouse.move(120, 420);
    await page.mouse.wheel(0, 420);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
  }
  throw new Error(`Nav item not found: ${label}`);
}

async function openGridRowByPattern(page, pattern) {
  await enableFlutterAccessibility(page);
  await page.waitForTimeout(6_000);
  for (let scroll = 0; scroll < 12; scroll += 1) {
    const row = typeof pattern === 'string'
      ? page.getByText(pattern, { exact: false })
      : page.getByText(pattern);
    if ((await row.count()) > 0) {
      await row.first().click({ force: true });
      await page.waitForTimeout(5_000);
      return;
    }
    await page.mouse.wheel(0, 320);
    await page.waitForTimeout(400);
  }
  const body = await page.evaluate(() => document.body?.innerText?.slice(0, 1200) ?? '');
  throw new Error(`Grid row not found: ${pattern}\n${body}`);
}

async function openFirstGridRow(page) {
  await enableFlutterAccessibility(page);
  await page.waitForTimeout(8_000);
  const patterns = [/^SKU-/i, /^PO-/i, /^SO-/i, /^INV-/i, /^JE-/i];
  for (let scroll = 0; scroll < 10; scroll += 1) {
    for (const pattern of patterns) {
      const row = page.getByText(pattern);
      if ((await row.count()) > 0) {
        await row.first().click({ force: true });
        await page.waitForTimeout(5_000);
        return;
      }
    }
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(450);
  }
  const body = await page.evaluate(() => document.body?.innerText?.slice(0, 1200) ?? '');
  throw new Error(`No grid row found. Body preview:\n${body}`);
}


async function scrollSettingsToTop(page) {
  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, -900);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);
}

async function waitSettingsScreen(page) {
  await enableFlutterAccessibility(page);
  await scrollSettingsToTop(page);
  await page.getByText(/Save changes|Platform settings|Primary color, logo, and tenant theme hints/i).first()
    .waitFor({ state: 'attached', timeout: 90_000 });
}

async function expandBrandingSettings(page) {
  await waitSettingsScreen(page);

  const orgExpanded = page.getByText(/Company display name|Upload logo/i);
  if ((await orgExpanded.count()) > 0) {
    const orgTile = page.getByText(/Organization/i).filter({ hasText: /Company name|contact info/i });
    if ((await orgTile.count()) > 0) {
      await orgTile.first().click({ force: true, timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(900);
    }
  }

  const brandingExpanded = async () => {
    if ((await page.getByLabel('Domain').count()) > 0) return true;
    if ((await page.getByText(/settings\.branding\.(secondaryColor|faviconUrl)/i).count()) > 0) return true;
    if ((await page.getByText(/Secondary accent color|Favicon URL/i).count()) > 0) return true;
    return false;
  };

  const tileSelectors = [
    () => page.getByText(/Primary color, logo, and tenant theme hints/i),
    () => page.getByRole('button', { name: /Branding.*Primary color/i }),
    () => page.getByText(/Branding Primary color, logo/i),
    () => page.getByText(/^Branding$/i),
  ];
  for (let i = 0; i < 48; i += 1) {
    if (await brandingExpanded()) return;
    for (const factory of tileSelectors) {
      const tile = factory();
      if ((await tile.count()) === 0) continue;
      const target = tile.first();
      await target.scrollIntoViewIfNeeded().catch(() => {});
      await target.click({ force: true, timeout: 3_000 }).catch(() => {});
      const box = await target.boundingBox();
      if (box) {
        await page.mouse.click(box.x + Math.max(8, box.width - 24), box.y + box.height / 2);
      }
      await page.waitForTimeout(1_400);
      if (await brandingExpanded()) return;
    }
    await page.mouse.move(195, 520);
    await page.mouse.wheel(0, 460);
    await page.waitForTimeout(280);
  }
  const body = await page.evaluate(() => document.body?.innerText?.slice(0, 2000) ?? '');
  throw new Error('Branding settings section not expanded\n' + body);
}

async function expandSettingsSection(page, labelPattern) {
  await waitSettingsScreen(page);

  const label = String(labelPattern);
  let tile;
  let expanded;
  if (/Organization/i.test(label)) {
    tile = page.getByText(/Organization/i).filter({ hasText: /Company name|contact info/i });
    expanded = page.getByText(/Company display name|Logo URL|Upload logo/i);
  } else if (/Branding/i.test(label)) {
    tile = page.getByText(/Branding/i).filter({ hasText: /Primary color|tenant theme/i });
    expanded = page.getByText(/Secondary accent|Favicon URL/i);
  } else {
    tile = page.getByText(labelPattern);
    expanded = page.getByText(/Company display name|Display name|Legal name/i);
  }

  for (let i = 0; i < 40; i += 1) {
    if ((await tile.count()) > 0) {
      try {
        await tile.first().click({ force: true, timeout: 3_000 });
        await page.waitForTimeout(1_200);
        if ((await expanded.count()) > 0) return;
      } catch {
        // scroll and retry
      }
    }
    await page.mouse.move(195, 520);
    await page.mouse.wheel(0, 480);
    await page.waitForTimeout(280);
  }
  const body = await page.evaluate(() => document.body?.innerText?.slice(0, 2000) ?? '');
  throw new Error(`Settings section not found: ${labelPattern}\n${body}`);
}


async function captureP26(page) {
  console.log('\nphase26-organization-profile-mobile.png…');
  await goBackToShell(page);
  await openDrawer(page);
  await tapPlatformNav(page, 'Settings');
  await page.getByText(/Save changes|Platform settings/i).first()
    .waitFor({ state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(2_000);
  let orgTile = page.getByText(/Organization/i).filter({ hasText: /Company name|contact info/i });
  for (let i = 0; i < 16; i += 1) {
    if ((await orgTile.count()) > 0) break;
    await page.mouse.move(195, 520);
    await page.mouse.wheel(0, 360);
    await page.waitForTimeout(280);
    orgTile = page.getByText(/Organization/i).filter({ hasText: /Company name|contact info/i });
  }
  await orgTile.first().click({ force: true });
  await page.waitForTimeout(1_500);
  await capture(page, 'phase26-organization-profile-mobile.png');
}

async function captureM2(page) {
  console.log('\nphase15-mobile-product-detail.png…');
  await openDrawer(page);
  await tapNav(page, 'Products');
  await openFirstGridRow(page);
  await capture(page, 'phase15-mobile-product-detail.png');
}

async function captureP24Admin(page) {
  const shots = [
    ['Admin users', 'phase24-mobile-admin-users.png'],
    ['Admin roles', 'phase24-mobile-admin-roles.png'],
    ['Security policies', 'phase24-mobile-admin-security.png'],
  ];
  for (const [nav, file] of shots) {
    console.log('\n%s…', file);
    await goBackToShell(page);
    await openDrawer(page);
    await tapNav(page, nav);
    await page.waitForTimeout(3_000);
    await capture(page, file);
  }
}

async function captureP25VendorPayment(browser) {
  console.log('\nphase25-vendor-payment-detail-mobile.png…');
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await openDrawer(page);
  await tapNav(page, 'Purchase Orders');
  await openGridRowByPattern(page, /PO-DEMO-002/i);
  await enableFlutterAccessibility(page);
  for (let i = 0; i < 10; i += 1) {
    const payment = page.getByText(/VP-DEMO-001|Payment summary|Vendor payments/i);
    if ((await payment.count()) > 0) break;
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1_000);
  await capture(page, 'phase25-vendor-payment-detail-mobile.png');
  await page.close();
}

async function captureP25(browser) {
  const shots = [
    ['Purchase Orders', 'phase25-purchase-order-detail-mobile.png', /PO-DEMO/i],
    ['Sales Orders', 'phase25-sales-order-detail-mobile.png', /SO-DEMO/i],
    ['Invoices', 'phase25-invoice-partial-mobile.png', /INV-DEMO/i],
    ['Journal Entries', 'phase25-journal-entry-detail-mobile.png', /JE-DEMO/i],
  ];
  for (const [nav, file, pattern] of shots) {
    console.log('\n%s…', file);
    const page = await browser.newPage({ viewport: VIEWPORT });
    await login(page);
    await openDrawer(page);
    await tapNav(page, nav);
    await openGridRowByPattern(page, pattern);
    await capture(page, file);
    await page.close();
  }
}

async function scrollUntilVisible(page, locatorFactory, maxScrolls = 24) {
  for (let i = 0; i < maxScrolls; i += 1) {
    const locator = locatorFactory();
    if ((await locator.count()) > 0) return locator.first();
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(320);
  }
  const body = await page.evaluate(() => document.body?.innerText?.slice(0, 1600) ?? '');
  throw new Error(`Scroll target not found\n${body}`);
}

async function captureP17Workflow(page) {
  console.log('\nphase17-workflow-inbox-mobile.png…');
  await goBackToShell(page);
  await openDrawer(page);
  await tapPlatformNav(page, 'Workflow tasks');
  await page.getByText(/Workflow tasks|No open workflow instances|Open Products|State|Assignee/i).first()
    .waitFor({ state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(2_500);
  await capture(page, 'phase17-workflow-inbox-mobile.png');
}

async function captureP17Account(browser) {
  console.log('\nphase17-account-profile-mobile.png…');
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await openDrawer(page);
  await tapPlatformNav(page, 'Account');
  await page.getByText(/Profile|MFA|Step 1|Assigned roles/i).first()
    .waitFor({ state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(2_500);
  await capture(page, 'phase17-account-profile-mobile.png');
  await page.close();
}

/** P31-T01–T03 — mobile platform services Product-ready PNG pack. */
async function captureP17PlatformServices(browser) {
  const screens = [
    { nav: 'Reports', file: 'phase17-reports-history-mobile.png', wait: /Reports|LOW_STOCK|Run|History|No reports/i },
    { nav: 'Dashboards', file: 'phase17-dashboards-mobile.png', wait: /Dashboard|KPI|No dashboards|widgets/i },
    { nav: 'Notifications', file: 'phase17-notifications-mobile.png', wait: /Notification|Mark read|No notifications|Inbox/i },
  ];
  for (const { nav, file, wait } of screens) {
    console.log('\n%s…', file);
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
      await login(page);
      await openDrawer(page);
      await tapPlatformNav(page, nav);
      await page.getByText(wait).first().waitFor({ state: 'attached', timeout: 90_000 });
      await page.waitForTimeout(2_000);
      await capture(page, file);
    } finally {
      await page.close();
    }
  }
}

async function captureP24DocumentPreview(browser) {
  console.log('\nphase24-document-preview-mobile.png…');
  await seedProductDocument();
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await openDrawer(page);
  await tapNav(page, 'Products');
  await openGridRowByPattern(page, /SKU-TOOL-8001/i);
  for (let i = 0; i < 16; i += 1) {
    const preview = page.getByRole('button', { name: /^Preview$/i });
    if ((await preview.count()) > 0) {
      await preview.first().click({ force: true });
      break;
    }
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(350);
    if (i === 15) throw new Error('Document preview button not found');
  }
  await page.getByText(/demo-spec|Demo product specification|Document preview|Download/i).first()
    .waitFor({ state: 'attached', timeout: 45_000 });
  await page.waitForTimeout(1_500);
  await capture(page, 'phase24-document-preview-mobile.png');
  await page.close();
}

async function switchLocaleBnBd(page) {
  const localeBtn = page.locator('[aria-label*="anguage" i], [aria-label*="ocale" i]').first();
  if ((await localeBtn.count()) > 0) {
    await localeBtn.click({ force: true });
    await page.waitForTimeout(500);
    const bn = page.getByText(/বাংলা|bn-BD/i).first();
    if ((await bn.count()) > 0) await bn.click({ force: true });
    await page.waitForTimeout(2_000);
  }
}

async function captureP27(page) {
  console.log('\nphase27-locale-switch-bn-bd-mobile.png…');
  await switchLocaleBnBd(page);
  await capture(page, 'phase27-locale-switch-bn-bd-mobile.png');
}

function isProductListRecordsUrl(url) {
  const u = url.toString();
  return u.includes('/api/v1/entities/PRODUCT/records')
    && !u.includes('/records/');
}

async function waitForBodyText(page, pattern, timeoutMs = 90_000) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  await page.waitForFunction(
    ({ source, flags }) => {
      const body = document.body?.innerText ?? '';
      return new RegExp(source, flags).test(body);
    },
    { source: re.source, flags: re.flags.replace('g', '') },
    { timeout: timeoutMs },
  );
}
/** Impossible search token — API returns `total: 0` (verified on live stack). */
const EMPTY_GRID_SEARCH = '__NO_MATCH_CAPTURE__';

async function submitGridSearch(page, query) {
  await enableFlutterAccessibility(page);
  await page.waitForTimeout(600);
  const candidates = [
    page.getByRole('textbox', { name: /^Search$/i }),
    page.getByLabel(/^Search$/i),
    page.getByPlaceholder(/^Search$/i),
    page.locator('flt-semantics[aria-label*="earch" i] input'),
    page.locator('input[type="text"], flt-semantics input, input'),
  ];
  let search = null;
  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      search = locator.first();
      break;
    }
  }
  if (!search) {
    const searchLabel = page.getByText(/^Search$/i).first();
    if ((await searchLabel.count()) > 0) {
      await searchLabel.click({ force: true });
      await page.waitForTimeout(300);
      for (const locator of candidates.slice(4)) {
        if ((await locator.count()) > 0) {
          search = locator.first();
          break;
        }
      }
    }
  }
  if (!search) {
    const body = await page.evaluate(() => document.body?.innerText?.slice(0, 1200) ?? '');
    throw new Error(`Grid search field not found\n${body}`);
  }
  await search.click({ force: true });
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(query, { delay: 40 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2_000);
}

async function waitForEmptyGrid(page, timeoutMs = 90_000) {
  const sku = page.getByText(/SKU-/i);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await sku.count()) === 0) {
      await page.waitForTimeout(1_500);
      return;
    }
    await page.waitForTimeout(400);
  }
  throw new Error('Empty grid not reached — PRODUCT SKU rows still visible');
}

async function captureRestore(browser) {
  console.log('\nphase14-mobile-soft-delete-restore.png…');
  await restoreProductRecord();
  const page = await browser.newPage({ viewport: VIEWPORT });
  try {
    await login(page);
    await openDrawer(page);
    await tapNav(page, 'Products');
    await openGridRowByPattern(page, /SKU-PKG-7002/i);
    const deleteBtn = page.getByRole('button', { name: /^Delete$/i });
    if ((await deleteBtn.count()) === 0) {
      throw new Error('Delete button not found on PRODUCT record');
    }
    await deleteBtn.first().click({ force: true });
    await page.waitForTimeout(800);
    const confirm = page.getByRole('button', { name: /^Delete$/i });
    if ((await confirm.count()) > 1) {
      await confirm.last().click({ force: true });
    } else if ((await confirm.count()) === 1) {
      await confirm.first().click({ force: true });
    }
    await page.getByText(/Restore|entity\.restore/i).first()
      .waitFor({ state: 'attached', timeout: 45_000 });
    await page.waitForTimeout(1_500);
    await capture(page, 'phase14-mobile-soft-delete-restore.png');
  } finally {
    await page.close();
    await restoreProductRecord();
  }
}

async function captureGridPack(browser, scope = 'all') {
  if (scope === 'all' || scope === 'datetime') {
  console.log('\nphase14-mobile-product-grid-system-columns.png…');
  {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await login(page);
    await openDrawer(page);
    await tapNav(page, 'Products');
    await page.getByText(/Sort created_at|created_at|SKU-/i).first()
      .waitFor({ state: 'attached', timeout: 90_000 });
    for (let i = 0; i < 8; i += 1) {
      if ((await page.getByText(/Sort created_at|Filter created_at/i).count()) > 0) break;
      await page.mouse.wheel(320, 0);
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(1_500);
    await capture(page, 'phase14-mobile-product-grid-system-columns.png');
    await capture(page, 'phase15-mobile-product-grid-polish.png');
    await page.close();
  }
  }

  if (scope === 'all' || scope === 'empty') {
  console.log('\nphase15-mobile-product-grid-empty.png…');
  {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    await login(page);
    await openDrawer(page);
    await tapNav(page, 'Products');
    await page.getByText(/SKU-/i).first().waitFor({ state: 'attached', timeout: 90_000 });
    const listUrl = (url) => {
      const href = url.toString();
      return /\/api\/v1\/entities\/PRODUCT\/records(\?.*)?$/.test(href)
        && !/\/records\/[^/?]+/.test(href);
    };
    await context.route(listUrl, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      url.searchParams.set('q', EMPTY_GRID_SEARCH);
      const response = await route.fetch({ url: url.toString() });
      await route.fulfill({ response });
    });
    const next = page.getByRole('button', { name: /^Next$/i });
    if ((await next.count()) > 0 && (await next.first().isEnabled())) {
      await next.first().click({ force: true });
    } else {
      await goBackToShell(page);
      await openDrawer(page);
      await tapNav(page, 'Products');
    }
    await page.waitForTimeout(2_000);
    await waitForEmptyGrid(page);
    await enableFlutterAccessibility(page);
    await page.waitForTimeout(1_000);
    await capture(page, 'phase15-mobile-product-grid-empty.png');
    await context.close();
  }
  }

  if (scope === 'all' || scope === 'loading') {
  console.log('\nphase15-mobile-product-grid-loading.png…');
  {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    await login(page);
    await openDrawer(page);
    await tapNav(page, 'Products');
    await page.getByText(/SKU-/i).first().waitFor({ state: 'attached', timeout: 90_000 });
    const listUrl = (url) => {
      const href = url.toString();
      return /\/api\/v1\/entities\/PRODUCT\/records(\?.*)?$/.test(href)
        && !/\/records\/[^/?]+/.test(href);
    };
    await context.route(listUrl, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await new Promise((r) => setTimeout(r, 5_000));
      await route.continue();
    });
    const next = page.getByRole('button', { name: /^Next$/i });
    if ((await next.count()) > 0 && (await next.first().isEnabled())) {
      await next.first().click({ force: true });
    } else {
      await goBackToShell(page);
      await openDrawer(page);
      await tapNav(page, 'Products');
    }
    await page.waitForTimeout(900);
    await capture(page, 'phase15-mobile-product-grid-loading.png');
    await context.close();
  }
  }

  if (scope === 'all' || scope === 'error') {
  console.log('\nphase15-mobile-product-grid-error-retry.png…');
  {
    const context = await browser.newContext({ viewport: VIEWPORT });
    let fail = true;
    await context.route(/\/api\/v1\/metadata\/forms\/PRODUCT(\?.*)?$/, async (route) => {
      if (fail) {
        fail = false;
        await route.fulfill({ status: 500, body: 'capture-induced metadata error' });
        return;
      }
      await route.continue();
    });
    const page = await context.newPage();
    await login(page);
    await openDrawer(page);
    await tapNav(page, 'Products');
    await page.getByRole('button', { name: /^Retry$/i }).first()
      .waitFor({ state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(800);
    await capture(page, 'phase15-mobile-product-grid-error-retry.png');
    await context.close();
  }
  }
}

async function captureEntityPack(browser, navLabel, gridFile, detailFile, rowPattern) {
  console.log('\n%s…', gridFile);
  const gridPage = await browser.newPage({ viewport: VIEWPORT });
  await login(gridPage);
  await openDrawer(gridPage);
  await tapNav(gridPage, navLabel);
  await gridPage.getByText(rowPattern).first().waitFor({ state: 'attached', timeout: 90_000 });
  await gridPage.waitForTimeout(2_000);
  await capture(gridPage, gridFile);
  await gridPage.close();

  console.log('\n%s…', detailFile);
  const detailPage = await browser.newPage({ viewport: VIEWPORT });
  await login(detailPage);
  await openDrawer(detailPage);
  await tapNav(detailPage, navLabel);
  await openGridRowByPattern(detailPage, rowPattern);
  await detailPage.waitForTimeout(2_000);
  await capture(detailPage, detailFile);
  await detailPage.close();
}

async function captureCrm(browser) {
  await captureEntityPack(
    browser,
    'Leads',
    'phase18-crm-lead-grid-mobile.png',
    'phase18-crm-lead-detail-mobile.png',
    /Acme Trading/i,
  );
  await captureEntityPack(
    browser,
    'Contacts',
    'phase18-crm-contact-grid-mobile.png',
    'phase18-crm-contact-detail-mobile.png',
    /Contact Person 1/i,
  );
}

async function captureMovement(browser) {
  await captureEntityPack(
    browser,
    'Stock Movements',
    'phase20-stock-movement-grid-mobile.png',
    'phase20-stock-movement-detail-mobile.png',
    /SM-DEMO-DRF-R01/i,
  );

  console.log('\nphase24-stock-movement-lines-mobile.png…');
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await openDrawer(page);
  await tapNav(page, 'Stock Movements');
  await openGridRowByPattern(page, /SM-DEMO-DRF-R01/i);
  await scrollUntilVisible(page, () => page.getByText(/Movement lines|movement lines|Add line/i));
  await page.waitForTimeout(1_500);
  await capture(page, 'phase24-stock-movement-lines-mobile.png');
  await page.close();
}

async function captureWarehouse(browser) {
  await captureEntityPack(
    browser,
    'Warehouses',
    'phase18-warehouse-grid-mobile.png',
    'phase18-warehouse-detail-mobile.png',
    /WH-DEMO-01/i,
  );
}

async function captureBranding(browser) {
  console.log('\nphase26-organization-logo-mobile.png…');
  console.log('\nphase19-settings-branding-mobile.png…');
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await openDrawer(page);
  await tapPlatformNav(page, 'Settings');
  await expandSettingsSection(page, /Organization/i);
  await scrollUntilVisible(page, () => page.getByText(/Upload logo|logo upload|Logo URL/i));
  await page.waitForTimeout(1_000);
  await capture(page, 'phase26-organization-logo-mobile.png');

  if ((await page.getByText(/Company display name|Upload logo/i).count()) > 0) {
    const orgTile = page.getByText(/Organization/i).filter({ hasText: /Company name|contact info/i });
    if ((await orgTile.count()) > 0) {
      await orgTile.first().click({ force: true });
      await page.waitForTimeout(900);
    }
  }
  await expandBrandingSettings(page);
  await scrollUntilVisible(page, () => page.getByLabel('Domain'));
  await page.waitForTimeout(1_000);
  await capture(page, 'phase19-settings-branding-mobile.png');
  await page.close();
}

async function captureInvoicePrint(browser) {
  console.log('\nphase25-invoice-print-mobile.png…');
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await openDrawer(page);
  await tapNav(page, 'Invoices');
  await openGridRowByPattern(page, /INV-DEMO/i);
  const printBtn = page.getByRole('button', { name: /Print invoice/i });
  await scrollUntilVisible(page, () => printBtn);
  await printBtn.first().click({ force: true });
  await page.getByText(/Invoice|INV-DEMO|Print/i).first()
    .waitFor({ state: 'attached', timeout: 45_000 });
  await page.waitForTimeout(1_500);
  await capture(page, 'phase25-invoice-print-mobile.png');
  await page.close();
}

async function captureLocaleFormat(browser) {
  console.log('\nphase27-locale-format-bn-bd-mobile.png…');
  const page = await browser.newPage({ viewport: VIEWPORT });
  await login(page);
  await switchLocaleBnBd(page);
  await openDrawer(page);
  await tapNav(page, 'Products');
  await page.getByText(/SKU-/i).first().waitFor({ state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(2_500);
  await capture(page, 'phase27-locale-format-bn-bd-mobile.png');
  await page.close();
}

function matchesOnly(...keys) {
  return ONLY === 'all' || keys.includes(ONLY);
}

async function main() {
  await assertApiUp();
  await mkdir(OUT_DIR, { recursive: true });

  console.log('Serving Flutter build/web at %s…', BASE);
  const server = await ensureStaticWebServer();

  try {
    await waitForUrl(BASE);
    const browser = await chromium.launch({ headless: true, args: CHROME_ARGS });
    const page = await browser.newPage({ viewport: VIEWPORT });
    await login(page);

    if (matchesOnly('m2')) await captureM2(page);
    if (matchesOnly('p24')) await captureP24Admin(page);
    if (matchesOnly('p25')) await captureP25(browser);
    if (matchesOnly('p25', 'vp')) await captureP25VendorPayment(browser);
    if (matchesOnly('p17')) {
      await captureP17Workflow(page);
      await captureP17Account(browser);
    }
    if (matchesOnly('p17-platform')) {
      await captureP17PlatformServices(browser);
    }
    if (matchesOnly('doc', 'p24doc')) {
      await captureP24DocumentPreview(browser);
    }
    if (matchesOnly('p26')) await captureP26(page);
    if (matchesOnly('p27')) await captureP27(page);
    if (matchesOnly('restore')) await captureRestore(browser);
    if (matchesOnly('grid')) await captureGridPack(browser, 'all');
    if (matchesOnly('grid-empty')) await captureGridPack(browser, 'empty');
    if (matchesOnly('grid-loading')) await captureGridPack(browser, 'loading');
    if (matchesOnly('grid-error')) await captureGridPack(browser, 'error');
    if (matchesOnly('crm')) await captureCrm(browser);
    if (matchesOnly('movement', 'm4')) await captureMovement(browser);
    if (matchesOnly('warehouse', 'm4')) await captureWarehouse(browser);
    if (matchesOnly('branding')) await captureBranding(browser);
    if (matchesOnly('invoice')) await captureInvoicePrint(browser);
    if (matchesOnly('localefmt')) await captureLocaleFormat(browser);

    if (ONLY === 'all') {
      await captureRestore(browser);
      await captureGridPack(browser, 'all');
      await captureCrm(browser);
      await captureMovement(browser);
      await captureWarehouse(browser);
      await captureBranding(browser);
      await captureInvoicePrint(browser);
      await captureLocaleFormat(browser);
    }

    await browser.close();
    const saved = await readdir(OUT_DIR);
    const mobile = saved.filter((f) => f.includes('-mobile') && f.endsWith('.png'));
    console.log('\nMobile PNG count in %s: %d', OUT_DIR, mobile.length);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
