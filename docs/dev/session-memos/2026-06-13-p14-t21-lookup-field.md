# P14-T21 — Lookup field type (API metadata)

**Date:** 2026-06-13  
**Task:** EMCAP-P14-T21 (Slice 14B-S2)

## Goal

Add `FieldType.LOOKUP` and `lookup_entity` on `FieldDefinition`; emit lookup metadata in form/grid JSON; validate lookup references at module load. No web/mobile renderers (T24–T26).

## Decisions

- Follow P14-T20 ENUM pattern: SDK type on `FieldDefinition`, metadata builder maps to `LayoutFieldType.LOOKUP`, registry validates cross-entity refs.
- Natural inventory example: `PRODUCT.primary_warehouse` → `WAREHOUSE` entity.
- Startup validation via `registry.validate()` in `main.py` (not HTTP 400 — app fails to boot on bad ref; T23 may formalize).
- Renderers deferred to P14-T24 (web) and P14-T25 (mobile).

## What changed

| Path | Change |
|------|--------|
| `platform/api/src/emcap/entity/models.py` | `FieldType.LOOKUP`, `lookup_entity`, pydantic validators |
| `platform/api/src/emcap/entity/registry.py` | Reject unknown `lookup_entity` in `validate()` |
| `platform/api/src/emcap/metadata/form_schema.py` | `LayoutFieldType.LOOKUP`, `lookup_entity` on form fields |
| `platform/api/src/emcap/metadata/grid_schema.py` | `lookup_entity` on grid columns |
| `platform/api/src/emcap/metadata/builder.py` | Map LOOKUP + emit `lookup_entity` in form/grid |
| `platform/api/src/emcap/persistence/repository.py` | Coerce LOOKUP values to string |
| `modules/inventory/module.py` | `PRODUCT.primary_warehouse` lookup → `WAREHOUSE` |
| `platform/api/tests/test_system_fields.py` | `test_product_lookup_field_metadata` |
| `platform/api/tests/test_entity_registry.py` | `test_registry_rejects_unknown_lookup_entity` |
| Docs | backlog, `07` matrix, codebase-index, plan/14, plan/16, plan/17 |

## Verification

```powershell
cd platform/api; python -m pytest tests/test_system_fields.py tests/test_inventory_e2e.py -q
# 20 passed
```

## Open follow-ups

- **P14-T22:** `CURRENCY`, `TEXTAREA` field types
- **P14-T23:** Builder validation polish; startup error surfacing
- **P14-T24:** Web lookup picker renderer
- **P14-T25:** Mobile lookup renderer
- **P14-T26:** Contract fixtures per field type
