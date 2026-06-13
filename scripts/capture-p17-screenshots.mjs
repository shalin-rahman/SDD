/**
 * P17 platform services web screenshot pack (EMCAP-P17-T10).
 * Prereq: local stack at http://localhost:4200 (admin / admin123).
 *
 * Usage (repo root):
 *   npx --yes playwright@1.49.1 install chromium
 *   node scripts/capture-p17-screenshots.mjs
 *
 * If capture fails: start stack with scripts\start-emcap-local.bat or
 *   scripts\run-emcap.bat --stack-only --local
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'product', 'screenshots');
const BASE = 'http://localhost:4200';
const VIEWPORT = { width: 1280, height: 800 };

/** @type {{ file: string; route: string; ready: string; note?: string }[]} */
const SHOTS = [
  {
    file: 'phase17-workflow-inbox-web.png',
    route: '/app/workflow',
    ready: '.workflow-page app-page-header, .workflow-page app-empty-state, .workflow-page .workflow-table',
  },
  {
    file: 'phase17-reports-history-web.png',
    route: '/app/reports',
    ready: '.reports-page app-section-card',
    note: 'Run first report if history empty',
  },
  {
    file: 'phase17-dashboards-kpi-web.png',
    route: '/app/dashboards',
    ready: '.dashboards-page .kpi-grid, .dashboards-page app-empty-state',
  },
  {
    file: 'phase17-notifications-web.png',
    route: '/app/notifications',
    ready: '.notifications-page .notifications-table, .notifications-page app-empty-state',
  },
  {
    file: 'phase17-assistant-web.png',
    route: '/app/assistant',
    ready: '.assistant-page app-assistant-chat-panel, .assistant-page app-empty-state',
    note: 'Shows disabled empty state when ai.enabled is false',
  },
  {
    file: 'phase17-account-profile-web.png',
    route: '/app/account',
    ready: '.profile-page app-section-card',
  },
];

async function assertStackUp() {
  let res;
  try {
    res = await fetch(BASE, { signal: AbortSignal.timeout(8_000) });
  } catch (err) {
    console.error(
      '\nERROR: Cannot reach %s — start the stack first:\n  scripts\\start-emcap-local.bat\n  or scripts\\run-emcap.bat --stack-only --local\n',
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
  await page.waitForSelector('app-page-header, .profile-page, .workflow-page', {
    timeout: 45_000,
  });
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function seedReportHistory(page) {
  const historyRows = page.locator('.reports-page .reports-table tbody tr');
  if ((await historyRows.count()) > 0) {
    return;
  }
  const runBtn = page
    .locator('.reports-page .reports-table tbody tr')
    .first()
    .getByRole('button')
    .first();
  if ((await runBtn.count()) === 0) {
    console.warn('WARN: no reports catalog rows — history section may be empty');
    return;
  }
  await runBtn.click();
  await page.waitForFunction(
    () => {
      const rows = document.querySelectorAll('.reports-page .reports-table tbody tr');
      return rows.length > 0;
    },
    { timeout: 60_000 },
  );
  await page.waitForTimeout(400);
}

async function capture(page, filename) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  wrote ${filename}`);
}

async function captureServicePage(page, shot) {
  console.log(`\n${shot.file} (${shot.route})…`);
  await page.goto(`${BASE}${shot.route}`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector(shot.ready, { timeout: 45_000 });

  if (shot.file === 'phase17-reports-history-web.png') {
    await seedReportHistory(page);
    const historyCard = page.locator('app-section-card').filter({ hasText: /history|historique|ইতিহাস/i }).last();
    if (await historyCard.count()) {
      await historyCard.scrollIntoViewIfNeeded();
    }
  }

  if (shot.file === 'phase17-account-profile-web.png') {
    const profileCard = page.locator('.profile-page app-section-card').first();
    await profileCard.waitFor({ state: 'visible' });
  }

  await capture(page, shot.file);

  if (shot.note) {
    console.log(`  note: ${shot.note}`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Checking stack…');
  await assertStackUp();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  try {
    console.log('Login…');
    await login(page);

    for (const shot of SHOTS) {
      await captureServicePage(page, shot);
    }

    console.log('\nP17 service UX pack complete:');
    for (const { file } of SHOTS) {
      console.log(`  docs/product/screenshots/${file}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
