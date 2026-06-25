# Mobile P17 platform PNGs — workflow inbox + document preview + account

**Date:** 2026-06-25  
**Goal:** Close matrix 07 §10 mobile Demo+ rows (workflow inbox, document preview, account profile) with device PNGs.

## Constraints

- No git commit (user rule)
- Do not modify `clients/web/package.json` for Playwright

## Script changes

`scripts/capture-mobile-signoff-screenshots.mjs`:

- `--only=p17` — `phase17-workflow-inbox-mobile.png`, `phase17-account-profile-mobile.png`
- `--only=doc` — `phase24-document-preview-mobile.png` (API document seed + PRODUCT preview dialog)
- `seedProductDocument()` for `SKU-TOOL-8001` record id

## Captures (2026-06-25)

| PNG | Size (bytes) |
|-----|----------------|
| `phase17-workflow-inbox-mobile.png` | 69055 |
| `phase17-account-profile-mobile.png` | 42921 |
| `phase24-document-preview-mobile.png` | 52652 |

## Matrix 07 (mobile Demo+ → Product-ready)

| Row | Before | After |
|-----|--------|-------|
| §10 Workflow inbox | Demo+ | **Product-ready (mobile)** |
| §10 Document preview | Demo+ | **Product-ready (mobile)** |
| §10 Account / profile | Demo+ | **Product-ready (mobile)** |
| M5 milestone | mobile Demo+ | **partial Product-ready** (P17 trio) |

Mobile PNG pack total: **14** (was 11).

## Remaining mobile Demo+

- §8 soft delete + restore
- §9 grid datetime/polish, loading skeleton, empty grid
- §12 mobile a11y semantics (test-based)
- §16 stock movement lines / UX
- §17 LEAD/CONTACT CRM
- §19 logo/favicon/branding/invoice print
- §20 locale-aware formatting
- M4 inventory mobile lane

## Verification

```text
node scripts/check-api-health.mjs
node scripts/capture-mobile-signoff-screenshots.mjs --only=p17
node scripts/capture-mobile-signoff-screenshots.mjs --only=doc
```

## Doc sync

- `spec/sdd/07-product-readiness-matrix.md`
- `plan/03-task-backlog.md` (P18-T18)
- `docs/dev/codebase-index.md`
- `docs/dev/known-pitfalls.md`
