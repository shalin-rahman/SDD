# S1 / M1 — PRODUCT web screenshot pack

**Date:** 2026-06-13  
**Tasks:** EMCAP-P15-T06, EMCAP-P20-T02  
**Sprint:** S1 (viable product critical path)

## Goal

Close M1 gate: PRODUCT web entity UX **Product-ready** with screenshot evidence in `docs/product/screenshots/`.

## What changed

| Path | Change |
|------|--------|
| `docs/product/screenshots/phase15-product-grid-polish.png` | Grid list, 20 demo rows, 1280×800 |
| `docs/product/screenshots/phase14-product-grid-system-columns.png` | Created / Last updated columns |
| `docs/product/screenshots/phase15-product-detail-hero.png` | Hero SKU — Name, Active chip, header actions |
| `docs/product/screenshots/phase14-product-detail-system-card.png` | System section card crop |
| `docs/product/screenshots/phase15-product-detail-hero-dark.png` | Detail in dark theme |
| `scripts/capture-m1-screenshots.mjs` | Playwright capture + UX checklist assertions |
| `spec/sdd/07-product-readiness-matrix.md` | M1 signed (web); §9 rows Product-ready |
| `plan/03-task-backlog.md` | P15-T06, P20-T02 Done |
| `plan/15-entity-page-redesign.md` | UX acceptance checkboxes checked |

## UX checklist (automated in script)

- Hero `SKU — Name` pattern
- Status chip present
- Save in header only (no form footer duplicate)
- System card visible
- Grid + detail captured at 1280×800

## Verification

```bat
scripts\start-emcap-local.bat
node scripts/capture-m1-screenshots.mjs
cd platform\api && python -m pytest tests/test_system_fields.py tests/test_inventory_e2e.py -q
```

18 pytest passed.

## Open follow-ups

- **S2 / M2:** mobile screenshots (P15-T13, P20-T03)
- P17 workflow inbox (S7) or P16 Flutter tokens (S3) per user preference
- No git commit until user review
