# Slice 15C complete — separate list/record (web + mobile)

**Date:** 2026-06-14

## Learned (memorize)

1. **C15 only** — list and entry are separate routes/screens; **C16 rejected** (no grid columns forced onto entry form).
2. **Web routes:** `/app/entity/:code` (grid), `/new`, `/:recordId` — `entity-list` + `entity-record`.
3. **Mobile:** `entity_list_screen` → push `entity_record_screen`; no `MasterDetailLayout` split.
4. **Screenshot scripts** must click grid row and wait for record URL before Workflow tab / detail captures.
5. **Removed** P15-T16 artifacts: `grid-form-parity.util.*`, `test_every_grid_column_in_form`, mobile `grid_form_parity.dart`.

## Done this session

- P15-T15 Done — M1 PNG pack refreshed via `capture-m1-screenshots.mjs`
- P15-T17 Done — mobile list/record split (subagent)
- `phase18-product-workflow-tab-web.png` — sprint script fixed
- Docs: backlog, plan/15, 07 matrix, pitfalls, registry

## Verification

- `node scripts/capture-m1-screenshots.mjs` — 5 PNGs
- `node scripts/capture-screenshot-sprint.mjs --only=product-workflow` — OK

## Next

- P15-T13 M2 mobile screenshots (Flutter blocked locally)
- P18-T06 CRM mobile product sign-off
- P19 admin depth (T03+)
- Optional: full sprint re-run for warehouse/CRM PNGs on separate routes
