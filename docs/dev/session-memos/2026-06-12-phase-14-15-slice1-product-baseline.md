# Phase 14/15 Slice 1 — entity platform baseline + PRODUCT redesign

## Goal
Pivot from Phase 12/13 admin toggles toward viable product: system fields in metadata/UI, PRODUCT reference entity page redesign, honest product-readiness matrices.

## Decisions
- Phase 12/13 backlog **Done** = Wired/Demo until screenshot + UX checklist (`07-product-readiness-matrix.md`)
- Phase 13 admin work **on hold** until PRODUCT entity page Product-ready
- No commit (user review first)

## What changed
- **Backend:** `system_fields.py`, metadata builder injects `system` form section + grid columns; `created_by` on `entity_records`; reject client system field injection
- **Tests:** `test_system_fields.py`, updated fixtures and inventory e2e
- **Web:** record detail header, section cards, datetime grid formatting, entity page PRODUCT headline/chips
- **Docs:** `plan/14-entity-platform-baseline.md`, `plan/15-entity-page-redesign.md`, `spec/sdd/07-product-readiness-matrix.md`, backlog/traceability/matrix updates

## Verification
- `pytest tests/test_system_fields.py tests/test_inventory_e2e.py` — 15 passed
- `npm run build` in `clients/web` — OK (bundle budget warning)

## Open follow-ups
- Capture screenshots for P15-T06 / Product-ready gate
- P14-T10: `updated_by`, version, soft delete
- P14-T12: mobile parity
- Phase 13 resumes after PRODUCT Product-ready
