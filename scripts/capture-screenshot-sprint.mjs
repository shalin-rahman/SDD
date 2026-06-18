/**
 * M4/M5 screenshot sprint — P17-T10 + P18-T03/T04/T05/T06 + W5 stock movement.
 * Prereq: local stack at http://localhost:4200 (admin / admin123).
 *
 * Usage (repo root):
 *   npx --yes playwright@1.49.1 install chromium
 *   node scripts/capture-screenshot-sprint.mjs
 *   node scripts/capture-screenshot-sprint.mjs --only=product-workflow
 *   node scripts/capture-screenshot-sprint.mjs --only=admin-security
 *   node scripts/capture-screenshot-sprint.mjs --only=admin-settings   # P18-T15 full M6 batch (8 PNGs)
 *   node scripts/capture-screenshot-sprint.mjs --only=login-auth       # P18-T11 login + account MFA
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'product', 'screenshots');
const BASE = 'http://localhost:4200';
const VIEWPORT = { width: 1280, height: 800 };

async function assertStackUp() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(
      '\nERROR: Cannot reach %s — start stack:\n  scripts\\start-emcap-local.bat\n',
      BASE,
    );
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
  await page.waitForSelector(
    'app-page-header, .entity-page, .entity-list-page, .settings-tabs, .profile-page',
    { timeout: 45_000 },
  );
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function capture(page, filename, options = {}) {
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, ...options });
  console.log(`  wrote ${filename}`);
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
    console.warn('WARN: no reports catalog rows');
    return;
  }
  await runBtn.click();
  await page.waitForFunction(
    () => document.querySelectorAll('.reports-page .reports-table tbody tr').length > 0,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(400);
}

async function captureServicePages(page) {
  const services = [
    {
      file: 'phase17-workflow-inbox-web.png',
      route: '/app/workflow',
      ready: '.workflow-page app-page-header, .workflow-page app-empty-state, .workflow-page .workflow-table',
    },
    {
      file: 'phase17-reports-history-web.png',
      route: '/app/reports',
      ready: '.reports-page app-section-card',
      after: seedReportHistory,
    },
    {
      file: 'phase17-dashboards-web.png',
      route: '/app/dashboards',
      ready: '.dashboards-page .kpi-grid, .dashboards-page app-empty-state',
    },
    {
      file: 'phase17-notifications-web.png',
      route: '/app/notifications',
      ready: '.notifications-page .notifications-table, .notifications-page app-empty-state',
    },
    {
      file: 'phase17-account-profile-web.png',
      route: '/app/account',
      ready: '.profile-page app-section-card',
    },
  ];

  for (const shot of services) {
    console.log(`\n${shot.file}…`);
    await page.goto(`${BASE}${shot.route}`, { waitUntil: 'networkidle' });
    await waitForShell(page);
    await page.waitForSelector(shot.ready, { timeout: 45_000 });
    if (shot.after) {
      await shot.after(page);
    }
    if (shot.file === 'phase17-reports-history-web.png') {
      const historyCard = page.locator('app-section-card').filter({ hasText: /history|historique|ইতিহাস/i }).last();
      if (await historyCard.count()) {
        await historyCard.scrollIntoViewIfNeeded();
      }
    }
    await capture(page, shot.file);
  }
}

async function captureLowStockReport(page) {
  console.log('\nphase18-inventory-low-stock-report.png…');
  await page.goto(`${BASE}/app/reports?code=LOW_STOCK`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.reports-page app-section-card', { timeout: 45_000 });
  await seedReportHistory(page);
  const highlighted = page.locator('.reports-table__row--highlight, .reports-card--highlight');
  if ((await highlighted.count()) === 0) {
    console.warn('WARN: LOW_STOCK row highlight not found — capturing page anyway');
  }
  await capture(page, 'phase18-inventory-low-stock-report.png');
}

async function openEntity(page, entityCode) {
  await page.goto(`${BASE}/app/entity/${entityCode}`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.data-grid__table tbody tr, .data-grid__table tr', { timeout: 45_000 });
  const rows = page.locator('.data-grid__table tr').filter({ has: page.locator('td') });
  await rows.first().waitFor({ state: 'visible', timeout: 30_000 });
  const count = await rows.count();
  if (count < 1) {
    throw new Error(`Expected seeded rows for ${entityCode}; found ${count}`);
  }
}

async function selectFirstRow(page) {
  const dataRow = page.locator('.data-grid__table tr').filter({ has: page.locator('td') }).first();
  await dataRow.scrollIntoViewIfNeeded();
  await dataRow.click();
  await page.waitForURL(/\/app\/entity\/[^/]+\/[^/]+$/, { timeout: 30_000 });
  await page.waitForSelector('app-record-detail-header, .record-header__title', { timeout: 30_000 });
  await page.locator('app-loading-panel').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
}

async function openRecordWorkflowTab(page) {
  const tabs = page.locator('.record-tabs__group [role="tab"]');
  await tabs.last().waitFor({ state: 'visible', timeout: 30_000 });
  await tabs.last().click();
}

async function captureEntityPack(page, entityCode, gridFile, detailFile) {
  console.log(`\n${gridFile} (${entityCode})…`);
  await openEntity(page, entityCode);
  await capture(page, gridFile);

  console.log(`${detailFile}…`);
  await selectFirstRow(page);
  await page.locator('app-record-detail-header').scrollIntoViewIfNeeded();
  await capture(page, detailFile);
}

async function captureEntityPacks(page) {
  await captureEntityPack(
    page,
    'WAREHOUSE',
    'phase18-warehouse-grid-web.png',
    'phase18-warehouse-detail-web.png',
  );
  await captureEntityPack(
    page,
    'STOCK_MOVEMENT',
    'phase20-stock-movement-grid-web.png',
    'phase20-stock-movement-detail-web.png',
  );
  await captureEntityPack(
    page,
    'LEAD',
    'phase18-crm-lead-grid-web.png',
    'phase18-crm-lead-detail-web.png',
  );
  await captureEntityPack(
    page,
    'CONTACT',
    'phase18-crm-contact-grid-web.png',
    'phase18-crm-contact-detail-web.png',
  );
}

async function captureProductWorkflowTab(page) {
  console.log('\nphase18-product-workflow-tab-web.png…');
  await openEntity(page, 'PRODUCT');
  await selectFirstRow(page);

  const startBtn = page.getByRole('button', { name: /Start STOCK_ADJUSTMENT/i });
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(500);
  }

  await openRecordWorkflowTab(page);
  await page
    .locator('.record-tabs__workflow-item, .record-tabs__empty, .record-tabs__inbox-link')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('app-record-tabs').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase18-product-workflow-tab-web.png');
}

async function captureReportViaNav(page) {
  console.log('\nphase18-inventory-low-stock-via-nav-web.png…');
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  const reportLink = page.locator('a[href="/app/reports"]').filter({ hasText: /Low Stock Report/i });
  if ((await reportLink.count()) === 0) {
    const fallback = page.locator('mat-nav-list a').filter({ hasText: /Low Stock Report/i }).first();
    await fallback.waitFor({ state: 'visible', timeout: 30_000 });
    await fallback.click();
  } else {
    await reportLink.first().click();
  }
  await page.waitForURL('**/app/reports**', { timeout: 30_000 });
  await waitForShell(page);
  await page.waitForSelector('.reports-page app-section-card', { timeout: 45_000 });
  await seedReportHistory(page);
  await capture(page, 'phase18-inventory-low-stock-via-nav-web.png');
}

async function captureAdminSecurity(page) {
  console.log('\nphase19-admin-security-field-access-web.png…');
  await page.goto(`${BASE}/app/admin/security`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.security-entity-list .admin-table tbody tr', { timeout: 45_000 });

  const entityRow = page.locator('.security-entity-list .admin-table tbody tr').first();
  await entityRow.waitFor({ state: 'visible', timeout: 30_000 });
  await entityRow.click();
  await page.waitForSelector('.security-detail .admin-table tbody tr', { timeout: 30_000 });

  const editBtn = page
    .locator('.security-detail .admin-table tbody tr')
    .first()
    .getByRole('button', { name: /Edit/i });
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
    await page
      .locator('.field-edit-panel app-permission-picker, .field-edit-panel')
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  } else {
    console.warn('WARN: field edit panel unavailable — capturing field matrix only');
  }

  await page.locator('.security-detail').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-admin-security-field-access-web.png');
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

async function captureShellNav(page) {
  console.log('\nphase19-shell-nav-web.png…');
  await page.goto(`${BASE}/app/entity/PRODUCT`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('app-sidenav-nav, mat-sidenav, .sidenav-nav', { timeout: 45_000 });
  await page.locator('app-sidenav-nav, mat-sidenav').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-shell-nav-web.png');
}

async function captureReportSchedules(page) {
  console.log('\nphase19-settings-report-schedules-web.png…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.settings-tabs, mat-tab-group', { timeout: 45_000 });
  await openSettingsTab(page, /Platform|Plateforme|প্ল্যাটফর্ম/i);
  await expandSettingsPanel(page, /Reports|Rapports|রিপোর্ট/i);
  await page.locator('.settings-report-schedules, .settings-hint').first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.locator('mat-expansion-panel').filter({ hasText: /Reports|Rapports|রিপোর্ট/i }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-settings-report-schedules-web.png');
}

async function captureAdminSettingsPolish(page) {
  console.log('\nphase19-settings-branding-web.png…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.settings-tabs, mat-tab-group', { timeout: 45_000 });
  await openSettingsTab(page, /Integrations|Intégrations|ইন্টিগ্রেশন/i);
  await expandSettingsPanel(page, /Branding|Marque|ব্র্যান্ডিং/i);
  await page.locator('app-branding-preview-panel').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('.settings-branding-split').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-settings-branding-web.png');

  console.log('phase19-settings-documents-web.png…');
  await openSettingsTab(page, /Platform|Plateforme|প্ল্যাটফর্ম/i);
  await expandSettingsPanel(page, /Documents|Document|নথি/i);
  await page.locator('.settings-document-form, .settings-document-cards').first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.locator('.settings-document-form, .settings-document-cards').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-settings-documents-web.png');

  console.log('phase19-settings-layout-editor-web.png…');
  await openSettingsTab(page, /Platform|Plateforme|প্ল্যাটফর্ম/i);
  await expandSettingsPanel(page, /Entity layouts|Dispositions|এনটিটি লেআউট/i);
  await page.locator('app-layout-editor-panel .layout-editor__table').first().waitFor({
    state: 'visible',
    timeout: 45_000,
  });
  await page.locator('app-layout-editor-panel').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-settings-layout-editor-web.png');

  console.log('phase19-settings-isolation-web.png…');
  await openSettingsTab(page, /Identity|Identité|পরিচয়/i);
  await expandSettingsPanel(page, /Tenant isolation|Isolation|টেন্যান্ট/i);
  await page.locator('.settings-readonly, .settings-field').first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.locator('mat-expansion-panel').filter({ hasText: /Tenant isolation|Isolation|টেন্যান্ট/i }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await capture(page, 'phase19-settings-isolation-web.png');
}

/** P18-T15 — full M6 admin/settings Product-ready screenshot batch. */
async function captureAdminProductReadyBatch(page) {
  await captureShellNav(page);
  console.log('\nphase19-settings-ia-web.png…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.settings-tabs, mat-tab-group', { timeout: 45_000 });
  await capture(page, 'phase19-settings-ia-web.png');

  console.log('phase19-admin-users-web.png…');
  await page.goto(`${BASE}/app/admin/users`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.admin-table, app-empty-state', { timeout: 45_000 });
  await capture(page, 'phase19-admin-users-web.png');

  console.log('phase19-admin-roles-web.png…');
  await page.goto(`${BASE}/app/admin/roles`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.admin-table, app-empty-state', { timeout: 45_000 });
  await capture(page, 'phase19-admin-roles-web.png');

  await captureAdminSecurity(page);
  await captureReportSchedules(page);
  await captureAdminSettingsPolish(page);
}

/** P18-T11 — enterprise auth UX: login provider cards + account MFA panel. */
async function captureLoginAuth(page, browser) {
  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();
  await loginPage.setViewportSize(VIEWPORT);
  console.log('\nphase18-login-web.png…');
  await loginPage.goto(BASE, { waitUntil: 'networkidle' });
  await loginPage.waitForSelector('.login-page, .login-card', { timeout: 45_000 });
  await loginPage.waitForSelector('.login-card__providers, .login-form', { timeout: 45_000 });
  await capture(loginPage, 'phase18-login-web.png');
  await loginContext.close();

  console.log('Login (account capture)…');
  await login(page);

  console.log('phase18-account-auth-web.png…');
  await page.goto(`${BASE}/app/account`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.profile-page .mfa-steps, app-section-card', { timeout: 45_000 });
  await page.locator('app-section-card').filter({ hasText: /MFA|2FA|authentification/i }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await capture(page, 'phase18-account-auth-web.png');
}

async function captureAdminAndSettings(page) {
  console.log('\nphase19-settings-ia-web.png…');
  await page.goto(`${BASE}/app/settings`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.settings-tabs, mat-tab-group', { timeout: 45_000 });
  await capture(page, 'phase19-settings-ia-web.png');

  console.log('phase19-admin-users-web.png…');
  await page.goto(`${BASE}/app/admin/users`, { waitUntil: 'networkidle' });
  await waitForShell(page);
  await page.waitForSelector('.admin-table, app-empty-state', { timeout: 45_000 });
  await capture(page, 'phase19-admin-users-web.png');

  await captureAdminSecurity(page);
}

const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Checking stack…');
  await assertStackUp();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  try {
    if (ONLY === 'login-auth') {
      await captureLoginAuth(page, browser);
      console.log('\nP18-T11 login/account auth capture complete — see docs/product/screenshots/');
      return;
    }

    console.log('Login…');
    await login(page);

    if (ONLY === 'product-workflow') {
      await captureProductWorkflowTab(page);
      console.log('\nFocused capture complete — see docs/product/screenshots/');
      return;
    }

    if (ONLY === 'entity-packs') {
      await captureEntityPacks(page);
      console.log('\nEntity pack capture complete — see docs/product/screenshots/');
      return;
    }

    if (ONLY === 'admin-security') {
      await captureAdminSecurity(page);
      console.log('\nAdmin security capture complete — see docs/product/screenshots/');
      return;
    }

    if (ONLY === 'admin-settings') {
      await captureAdminProductReadyBatch(page);
      console.log('\nP18-T15 admin/settings Product-ready capture complete — see docs/product/screenshots/');
      return;
    }

    if (ONLY === 'shell-nav') {
      await captureShellNav(page);
      console.log('\nShell/nav capture complete — see docs/product/screenshots/');
      return;
    }

    if (ONLY === 'report-schedules') {
      await captureReportSchedules(page);
      console.log('\nReport schedules capture complete — see docs/product/screenshots/');
      return;
    }

    await captureServicePages(page);
    await captureLowStockReport(page);
    await captureReportViaNav(page);
    await captureProductWorkflowTab(page);
    await captureEntityPacks(page);
    await captureAdminAndSettings(page);

    console.log('\nScreenshot sprint complete — see docs/product/screenshots/');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
