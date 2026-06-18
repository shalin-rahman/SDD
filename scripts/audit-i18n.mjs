/**
 * P18-T12 — scan web/mobile sources for likely hard-coded user-facing strings.
 * Does not fail CI; prints a gap report for manual follow-up.
 *
 * Usage: node scripts/audit-i18n.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SKIP_DIRS = new Set(['node_modules', 'dist', '.angular', 'test', 'integration_test', '__pycache__']);
const ALLOWLIST = [
  /^EMCAP$/,
  /^admin$/,
  /^admin123$/,
  /^SKU$/i,
  /^—$/,
  /^Loading…$/,
  /^mat-icon$/,
];

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function scanFile(file, patterns) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('i18n.t(') || line.includes('EmcapLocale.t(') || line.includes('I18nService.t(')) {
      continue;
    }
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (!m) continue;
      const value = m[1] ?? m[0];
      if (ALLOWLIST.some((re) => re.test(value))) continue;
      if (/^[a-z_][\w.]*$/.test(value)) continue;
      hits.push({ line: i + 1, value, snippet: line.trim().slice(0, 120) });
    }
  }
  return hits.length ? { file: rel, hits } : null;
}

const webPatterns = [
  />([A-Z][A-Za-z0-9 ,.'()/–-]{2,})</,
  /labelText:\s*'([^']+)'/,
  /mat-label>([^<]+)</,
];
const mobilePatterns = [
  /Text\(\s*'([^']+)'\s*[,)]/,
  /Text\(\s*"([^"]+)"\s*[,)]/,
  /labelText:\s*'([^']+)'/,
  /title:\s*const Text\('([^']+)'\)/,
];

const webFiles = walk(path.join(ROOT, 'clients/web/src/app'), ['.html', '.ts']);
const mobileFiles = walk(path.join(ROOT, 'clients/mobile/lib'), ['.dart']);

const gaps = [];
for (const f of webFiles) {
  const r = scanFile(f, webPatterns);
  if (r) gaps.push({ surface: 'web', ...r });
}
for (const f of mobileFiles) {
  const r = scanFile(f, mobilePatterns);
  if (r) gaps.push({ surface: 'mobile', ...r });
}

console.log(`# i18n audit — ${gaps.length} file(s) with possible hard-coded strings\n`);
for (const entry of gaps.slice(0, 40)) {
  console.log(`## [${entry.surface}] ${entry.file}`);
  for (const h of entry.hits.slice(0, 5)) {
    console.log(`  L${h.line}: "${h.value}" — ${h.snippet}`);
  }
  if (entry.hits.length > 5) {
    console.log(`  … +${entry.hits.length - 5} more on this file`);
  }
  console.log('');
}
if (gaps.length > 40) {
  console.log(`… +${gaps.length - 40} more files (re-run locally for full list)`);
}
console.log('Fixed in P18-T12: lookup picker/field, tenant select, mobile admin/settings bodies.');
console.log('Remaining low priority: branding preview "EMCAP", settings mobile Theme/Domain labels, dynamic data.');
