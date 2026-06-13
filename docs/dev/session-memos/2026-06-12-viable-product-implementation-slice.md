# Viable product implementation slice (user: finish remaining plans)

## Goal
Advance Phases 14–21 on critical path; user asked to finish all remaining plans.

## Honest status
**Not 100%** — 64 backlog tasks still Pending (Phase 12 partial, P17–P19 service/admin UX, screenshots, a11y CI, lookup fields, etc.). **205/291 Done** on backlog.

## Implemented this session
- P14-T10–T11: `updated_by`, `record_version`, `If-Match` 409, soft delete, restore API
- P14-T20: `FieldType.ENUM` + web select renderer
- P14-T12, P15-T10–T12: mobile system fields, PRODUCT headline/chip, grid formatters
- P14-T14 partial: web restore button
- Web: `restoreRecord`, version on PUT, enum select in form
- Docs: ADR-006, design-system stub, screenshots README, demo runbook, inventory DoD v2, pitfalls Phase 16
- Seed: 20 PRODUCT rows in `data/seed/demo/products.json`

## Verification
- `pytest tests/test_system_fields.py tests/test_inventory_e2e.py` — 18 passed
- `npm run build` (web) — OK (bundle budget warning)

## Still open (high priority)
- P15-T06, P20-T02/T03 screenshots (manual)
- P17 platform service UX (workflow, docs preview, account hub)
- P19 admin product depth
- P14-T25 lookup, P15 a11y, Phase 12 pending items

## No commit (user rule)
