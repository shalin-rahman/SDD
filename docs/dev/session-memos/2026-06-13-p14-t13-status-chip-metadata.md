# P14-T13 — Status chip metadata contract

**Date:** 2026-06-13  
**Task:** EMCAP-P14-T13 (Slice 14C-S1)

## Goal

Replace hard-coded PRODUCT `active` status chip with metadata-driven contract exposed in form/grid metadata API; web reads `display.status_field` for chip label and active state.

## Decisions

- Business mapping lives in `modules/inventory/module.py` via `EntityOptions.status_field` (`StatusFieldDisplay`).
- Platform injects `display.status_field` into both form and grid metadata in `metadata/builder.py`.
- Web `buildStatusChipView` in `record-headline.util.ts` resolves label from metadata labels + locale; entity page passes `formMeta.display.status_field`.
- Mobile still hard-codes `active` — out of scope for this slice (backlog Partial).

## What changed

| Path | Change |
|------|--------|
| `platform/api/src/emcap/entity/models.py` | `StatusFieldDisplay`, `EntityOptions.status_field` |
| `platform/api/src/emcap/metadata/display_schema.py` | `StatusFieldMetadata`, `DisplayMetadata` |
| `platform/api/src/emcap/metadata/form_schema.py`, `grid_schema.py` | `display` on metadata models |
| `platform/api/src/emcap/metadata/builder.py` | `_build_display()` injection |
| `modules/inventory/module.py` | PRODUCT `status_field` for `active` |
| `platform/api/tests/test_system_fields.py` | `test_product_metadata_status_field_contract` |
| `clients/web/src/app/metadata/contract.ts` | TS types for display contract |
| `clients/web/src/app/shared/utils/record-headline.util.ts` | Metadata-driven chip |
| `clients/web/src/app/pages/entity/entity.component.ts` | Pass status field to headline util |
| Docs | `07` matrix, backlog, traceability, codebase-index, plan/14 |

## Verification

```powershell
cd platform/api; python -m pytest tests/test_system_fields.py -q
# 8 passed

cd clients/web; npm run build
# FAILED — pre-existing P17 doc-preview template errors (closeDocumentPreview, versionLabel, virusBadgeClass); unrelated to P14-T13
```

## Open follow-ups

- Mobile: read `display.status_field` in `entity_screen.dart` (P14-T13 completion).
- P15-T20: generalize hero/subtitle rules via full `display` hints.
