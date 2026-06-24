# Mobile Product-ready sign-off — screenshot refresh

**Date:** 2026-06-25  
**Goal:** Run `capture-mobile-signoff-screenshots.mjs` against live stack; elevate matrix 07 mobile Demo+ rows with PNG evidence.

## Constraints

- No git commit (user rule)
- Minimize unrelated code changes (Playwright npm install reverted after capture)

## Stack

- API already running (`node scripts/check-api-health.mjs` → ok)
- `flutter build web --dart-define=EMCAP_API_URL=http://localhost:8000` (~279s)
- Playwright: temporary `npm install playwright@1.49.1` in `clients/web` + `npx playwright install chromium` (reverted from package.json after run)

## Capture

```text
cd clients/web
node ../../scripts/capture-mobile-signoff-screenshots.mjs
```

**11 PNGs saved/updated** in `docs/product/screenshots/` (2026-06-25 timestamps):

- `phase15-mobile-product-detail.png`
- `phase24-mobile-admin-users.png`, `phase24-mobile-admin-roles.png`, `phase24-mobile-admin-security.png`
- `phase25-purchase-order-detail-mobile.png`, `phase25-sales-order-detail-mobile.png`, `phase25-invoice-partial-mobile.png`, `phase25-journal-entry-detail-mobile.png`, `phase25-vendor-payment-detail-mobile.png`
- `phase26-organization-profile-mobile.png`
- `phase27-locale-switch-bn-bd-mobile.png`

## Matrix 07 updates (mobile Demo+ → Product-ready)

| Row | Before | After |
|-----|--------|-------|
| §8 `created_at` / `updated_at` | Mobile Demo+ | **Product-ready** |
| §8 `created_by` | Mobile Demo+ | **Product-ready** |
| §8 System fields in form metadata | Mobile Demo+ | **Product-ready** |
| §8 `updated_by` | Mobile Demo+ | **Product-ready** |
| §8 `record_version` + If-Match | Mobile Demo+ | **Product-ready** |
| §8 Status chip metadata | Mobile Demo+ | **Product-ready (mobile)** |
| §9 Professional density | Mobile Demo+ | **Product-ready (mobile)** |

Evidence: M2 PNG shows hero, ACTIVE chip, Product/System cards, formatted dates, Version field.

## Remaining mobile Demo+ (no dedicated PNG in pack)

- §8 soft delete + restore
- §9 grid datetime/polish, loading skeleton, empty grid
- §10 workflow inbox, document preview, account profile
- §12 mobile a11y semantics (test-based)
- §16 stock movement lines / UX
- §17 LEAD/CONTACT CRM
- §19 logo/favicon/branding/invoice print
- §20 locale-aware number/currency/date formatting
- Milestones M4/M5 platform/inventory mobile lanes

## Doc sync

- `spec/sdd/07-product-readiness-matrix.md`
- `plan/03-task-backlog.md` (P27-T12 mobile closed)
- `docs/dev/codebase-index.md` (capture script row)
- `docs/dev/HANDOFF-continue-standard-product.md`

## Capture notes

- Full `--only=all` run succeeded for M2, P24 admin×3, P26, P27 (2026-06-25).
- P25 SO/INV/JE initially regressed (404 stale PO record id) when reusing one Playwright page; **fixed** `captureP25()` / `captureP25VendorPayment()` to use fresh page+login per entity; re-captured all 5 P25 PNGs successfully.
- Pitfall: `docs/dev/known-pitfalls.md` § Mobile signoff Playwright P25 batch.

## Open follow-ups

- Optional: extend capture script for workflow inbox, document preview, CRM, stock movement mobile PNGs
