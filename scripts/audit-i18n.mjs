/**
 * P27 - audit web/mobile i18n JSON bundles.
 * Checks: bn-BD keys vs en-US, secret-like strings, UTF-8, interpolation parity,
 * web vs mobile key parity (en-US / bn-BD / fr-FR).
 *
 * Usage: node scripts/audit-i18n.mjs
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WEB_DIR = path.join(ROOT, 'clients/web/src/assets/i18n');
const MOBILE_DIR = path.join(ROOT, 'clients/mobile/assets/i18n');

const SURFACES = [
  { name: 'web', dir: WEB_DIR },
  { name: 'mobile', dir: MOBILE_DIR },
];

const BCP47_LOCALES = ['en-US', 'bn-BD', 'fr-FR'];

/** Mobile-only keys allowed until web sync (mirrors i18n_keys_parity_test.dart). */
const KNOWN_MOBILE_ONLY_PREFIXES = [
  'a11y.',
  'ux.',
  'tech.',
  'security.',
  'deployment.',
  'org.',
  'number.',
  'date.',
];
const KNOWN_MOBILE_ONLY_EXACT = new Set([
  'entity.addLine',
  'sales.so.linesEmpty',
  'sales.so.linesFailed',
]);

const SECRET_VALUE_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /\b(sk_|pk_)[a-z0-9_]{16,}/i,
  /\b(api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*\S+/i,
  /\bbearer\s+[a-z0-9._-]{20,}/i,
  /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\./,
];

function looksLikeSecretValue(val) {
  return SECRET_VALUE_PATTERNS.some((re) => re.test(val));
}
const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function isValidUtf8(filePath) {
  const buf = readFileSync(filePath);
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
    return true;
  } catch {
    return false;
  }
}

function loadStrings(filePath) {
  const obj = JSON.parse(readFileSync(filePath, 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function placeholders(value) {
  const m = value.match(PLACEHOLDER_RE);
  return m ? [...new Set(m)].sort() : [];
}

function isKnownMobileOnly(key) {
  if (KNOWN_MOBILE_ONLY_EXACT.has(key)) return true;
  return KNOWN_MOBILE_ONLY_PREFIXES.some((p) => key.startsWith(p));
}

function auditSurface({ name, dir }) {
  const enPath = path.join(dir, 'en-US.json');
  const bnPath = path.join(dir, 'bn-BD.json');
  const result = {
    surface: name,
    dir: rel(dir),
    missingBnKeys: [],
    secrets: [],
    nonUtf8: [],
    interpolation: [],
    errors: [],
  };

  for (const fp of [enPath, bnPath]) {
    try {
      statSync(fp);
    } catch {
      result.errors.push(`missing file ${rel(fp)}`);
      return result;
    }
    if (!isValidUtf8(fp)) result.nonUtf8.push(rel(fp));
  }

  const en = loadStrings(enPath);
  const bn = loadStrings(bnPath);

  for (const key of Object.keys(en).sort()) {
    if (!(key in bn)) result.missingBnKeys.push(key);
  }

  for (const [locale, bundle] of [
    ['en-US', en],
    ['bn-BD', bn],
  ]) {
    for (const [key, val] of Object.entries(bundle)) {
      if (looksLikeSecretValue(val)) {
        result.secrets.push({ locale, key });
      }
    }
  }

  for (const key of Object.keys(en)) {
    const enPh = placeholders(en[key]);
    if (enPh.length === 0 || !(key in bn)) continue;
    const bnPh = placeholders(bn[key]);
    if (enPh.join('|') !== bnPh.join('|')) {
      result.interpolation.push({ key, en: enPh, bn: bnPh });
    }
  }

  return result;
}

function auditCrossSurfaceParity() {
  const result = {
    webMissingOnMobile: {},
    unexpectedMobileOnly: [],
    orgBnParityMismatch: [],
    errors: [],
  };

  for (const locale of BCP47_LOCALES) {
    const webPath = path.join(WEB_DIR, `${locale}.json`);
    const mobilePath = path.join(MOBILE_DIR, `${locale}.json`);
    try {
      statSync(webPath);
      statSync(mobilePath);
    } catch (e) {
      result.errors.push(String(e.message ?? e));
      continue;
    }

    const webKeys = new Set(Object.keys(loadStrings(webPath)));
    const mobileKeys = new Set(Object.keys(loadStrings(mobilePath)));
    const missingOnMobile = [...webKeys].filter((k) => !mobileKeys.has(k)).sort();
    if (missingOnMobile.length) result.webMissingOnMobile[locale] = missingOnMobile;
  }

  const webEn = loadStrings(path.join(WEB_DIR, 'en-US.json'));
  const mobileEn = loadStrings(path.join(MOBILE_DIR, 'en-US.json'));
  const mobileOnly = Object.keys(mobileEn).filter((k) => !(k in webEn));
  result.unexpectedMobileOnly = mobileOnly.filter((k) => !isKnownMobileOnly(k)).sort();

  const webBn = loadStrings(path.join(WEB_DIR, 'bn-BD.json'));
  const mobileBn = loadStrings(path.join(MOBILE_DIR, 'bn-BD.json'));
  const orgWebKeys = Object.keys(webBn)
    .filter((k) => k.startsWith('settings.organization.'))
    .sort();
  const orgMobileKeys = new Set(
    Object.keys(mobileBn).filter((k) => k.startsWith('settings.organization.')),
  );
  result.orgBnParityMismatch = orgWebKeys.filter((k) => !orgMobileKeys.has(k));

  return result;
}

console.log('# P27 i18n JSON audit\n');

const summaries = [];
for (const surface of SURFACES) {
  const r = auditSurface(surface);
  summaries.push(r);
  console.log(`## ${r.surface} (${r.dir})`);
  if (r.errors.length) {
    for (const e of r.errors) console.log(`  ERROR: ${e}`);
    console.log('');
    continue;
  }
  console.log(`- missing bn-BD keys (vs en-US): ${r.missingBnKeys.length}`);
  for (const k of r.missingBnKeys.slice(0, 20)) console.log(`    ${k}`);
  if (r.missingBnKeys.length > 20) {
    console.log(`    ... +${r.missingBnKeys.length - 20} more`);
  }
  console.log(`- secret-like bundle values: ${r.secrets.length}`);
  for (const s of r.secrets.slice(0, 10)) {
    console.log(`    [${s.locale}] ${s.key}`);
  }
  console.log(`- non-UTF-8 files: ${r.nonUtf8.length}`);
  for (const f of r.nonUtf8) console.log(`    ${f}`);
  console.log(`- interpolation mismatches: ${r.interpolation.length}`);
  for (const row of r.interpolation.slice(0, 15)) {
    console.log(`    ${row.key}: en=${JSON.stringify(row.en)} bn=${JSON.stringify(row.bn)}`);
  }
  if (r.interpolation.length > 15) {
    console.log(`    ... +${r.interpolation.length - 15} more`);
  }
  console.log('');
}

const parity = auditCrossSurfaceParity();
console.log('## web vs mobile key parity');
if (parity.errors.length) {
  for (const e of parity.errors) console.log(`  ERROR: ${e}`);
} else {
  for (const locale of BCP47_LOCALES) {
    const missing = parity.webMissingOnMobile[locale] ?? [];
    console.log(`- ${locale}: web keys missing on mobile: ${missing.length}`);
    for (const k of missing.slice(0, 15)) console.log(`    ${k}`);
    if (missing.length > 15) console.log(`    ... +${missing.length - 15} more`);
  }
  console.log(`- unexpected mobile-only keys (en-US): ${parity.unexpectedMobileOnly.length}`);
  for (const k of parity.unexpectedMobileOnly.slice(0, 15)) console.log(`    ${k}`);
  console.log(`- bn-BD settings.organization.* missing on mobile: ${parity.orgBnParityMismatch.length}`);
  for (const k of parity.orgBnParityMismatch.slice(0, 15)) console.log(`    ${k}`);
}
console.log('');

const totals = summaries.reduce(
  (acc, r) => {
    acc.missing += r.missingBnKeys.length;
    acc.secrets += r.secrets.length;
    acc.nonUtf8 += r.nonUtf8.length;
    acc.interpolation += r.interpolation.length;
    acc.errors += r.errors.length;
    return acc;
  },
  { missing: 0, secrets: 0, nonUtf8: 0, interpolation: 0, errors: 0 },
);

const parityMissing = Object.values(parity.webMissingOnMobile).reduce((n, arr) => n + arr.length, 0);

console.log('## Summary');
console.log(
  `missing bn-BD=${totals.missing}, secrets=${totals.secrets}, non-UTF8=${totals.nonUtf8}, interpolation=${totals.interpolation}, surface errors=${totals.errors}, web→mobile missing=${parityMissing}, unexpected mobile-only=${parity.unexpectedMobileOnly.length}, org bn-BD gap=${parity.orgBnParityMismatch.length}`,
);

const failed =
  totals.errors > 0 ||
  totals.missing > 0 ||
  totals.secrets > 0 ||
  totals.nonUtf8 > 0 ||
  totals.interpolation > 0 ||
  parity.errors.length > 0 ||
  parityMissing > 0 ||
  parity.unexpectedMobileOnly.length > 0 ||
  parity.orgBnParityMismatch.length > 0;
process.exitCode = failed ? 1 : 0;
