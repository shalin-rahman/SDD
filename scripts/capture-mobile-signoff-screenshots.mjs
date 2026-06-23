/**
 * Mobile Product-ready PNG pack — Flutter web at phone viewport (390×844).
 * Prereq: API on :8000 with demo seed (`scripts\start-emcap-local.bat`).
 *
 * Usage (repo root, after `flutter build web` in clients/mobile):
 *   node scripts/capture-mobile-signoff-screenshots.mjs
 *   node scripts/capture-mobile-signoff-screenshots.mjs --only=m2
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
const API_HEALTH = 'http://localhost:8000/api/v1/health';
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

function startStaticWeb() {
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
  server.listen(WEB_PORT, '127.0.0.1');
  return server;
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

async function expandSettingsSection(page, labelPattern) {
  await enableFlutterAccessibility(page);
  await page.getByText(/Save changes|Platform settings/i).first()
    .waitFor({ state: 'attached', timeout: 90_000 });
  const patterns = [
    labelPattern,
    /Organization/i,
    /Company name, contact/i,
    /Organisation/i,
  ];
  for (let i = 0; i < 40; i += 1) {
    for (const pattern of patterns) {
      for (const locator of [
        page.getByRole('button', { name: pattern }),
        page.getByText(pattern),
      ]) {
        if ((await locator.count()) > 0) {
          try {
            await locator.first().click({ force: true, timeout: 3_000 });
            await page.waitForTimeout(1_200);
            const expanded = page.getByText(/Company display name|Display name|Legal name/i);
            if ((await expanded.count()) > 0) return;
          } catch {
            // scroll and retry
          }
        }
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

async function captureP25VendorPayment(page) {
  console.log('\nphase25-vendor-payment-detail-mobile.png…');
  await goBackToShell(page);
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
}

async function captureP25(page) {
  const shots = [
    ['Purchase Orders', 'phase25-purchase-order-detail-mobile.png'],
    ['Sales Orders', 'phase25-sales-order-detail-mobile.png'],
    ['Invoices', 'phase25-invoice-partial-mobile.png'],
    ['Journal Entries', 'phase25-journal-entry-detail-mobile.png'],
  ];
  for (const [nav, file] of shots) {
    console.log('\n%s…', file);
    await goBackToShell(page);
    await openDrawer(page);
    await tapNav(page, nav);
    await openFirstGridRow(page);
    await capture(page, file);
  }
}

async function captureP27(page) {
  console.log('\nphase27-locale-switch-bn-bd-mobile.png…');
  const localeBtn = page.locator('[aria-label*="anguage" i], [aria-label*="ocale" i]').first();
  if ((await localeBtn.count()) > 0) {
    await localeBtn.click({ force: true });
    await page.waitForTimeout(500);
    const bn = page.getByText(/বাংলা|bn-BD/i).first();
    if ((await bn.count()) > 0) await bn.click({ force: true });
    await page.waitForTimeout(2_000);
  }
  await capture(page, 'phase27-locale-switch-bn-bd-mobile.png');
}

async function main() {
  await assertApiUp();
  await mkdir(OUT_DIR, { recursive: true });

  console.log('Serving Flutter build/web at %s…', BASE);
  const server = startStaticWeb();

  try {
    await waitForUrl(BASE);
    const browser = await chromium.launch({ headless: true, args: CHROME_ARGS });
    const page = await browser.newPage({ viewport: VIEWPORT });
    await login(page);

    if (ONLY === 'all' || ONLY === 'm2') await captureM2(page);
    if (ONLY === 'all' || ONLY === 'p24') await captureP24Admin(page);
    if (ONLY === 'all' || ONLY === 'p25') await captureP25(page);
    if (ONLY === 'all' || ONLY === 'p25' || ONLY === 'vp') await captureP25VendorPayment(page);
    if (ONLY === 'all' || ONLY === 'p26') await captureP26(page);
    if (ONLY === 'all' || ONLY === 'p27') await captureP27(page);

    await browser.close();
    const saved = await readdir(OUT_DIR);
    const mobile = saved.filter((f) => f.includes('-mobile') && f.endsWith('.png'));
    console.log('\nMobile PNG count in %s: %d', OUT_DIR, mobile.length);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
