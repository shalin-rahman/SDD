# Mobile grid-empty screenshot capture fix

**Date:** 2026-06-25  
**Goal:** Unblock `capture-mobile-signoff-screenshots.mjs --only=grid-empty` (90s timeout).

## Root cause

1. Early `context.route` + `route.fulfill(empty JSON)` on first PRODUCT list load broke Flutter web cross-origin fetch (no CORS headers) — entity list never reached a capturable state.
2. `waitForBodyText` / `getByText(/No records yet/)` cannot see Flutter canvas text even when the empty state is visibly rendered.
3. `page.waitForFunction(fn, { timeout })` — lone object is the **function argument**, not options (30s default timeout).

## Fix

Mirror **grid-loading** in `captureGridPack()` empty branch:

1. Fresh context + login → Products → wait for `SKU-`.
2. Register `context.route` on PRODUCT list URL; `route.fetch` live API with `q=__NO_MATCH_CAPTURE__`.
3. Click **Next** to trigger intercepted reload.
4. `waitForEmptyGrid` polls until `getByText(/SKU-/)` count is 0.
5. Capture `phase15-mobile-product-grid-empty.png`.

## Verification

```text
node scripts/capture-mobile-signoff-screenshots.mjs --only=grid-empty
```

- `docs/product/screenshots/phase15-mobile-product-grid-empty.png` — **41,154 bytes** (empty inbox + “No records yet…” + New CTA).
- `phase15-mobile-product-grid-loading.png` — 37,972 bytes (prior successful run).

## Doc sync

- `spec/sdd/07-product-readiness-matrix.md` §9 — loading + empty grid mobile PNG evidence; empty row → **Product-ready (mobile)**.
- `docs/dev/known-pitfalls.md` — § Mobile signoff Playwright grid-empty.
- `docs/dev/codebase-index.md` — capture script flags.

## Open follow-ups

- None for grid-empty; optional re-capture `grid-error` / full `--only=grid` pack.
