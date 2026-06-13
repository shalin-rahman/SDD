# P14-T22 — Currency + textarea field types (API metadata)

**Date:** 2026-06-13  
**Task:** EMCAP-P14-T22 (Slice 14B-S2)

## Goal

Add `FieldType.CURRENCY` (with `currency_code`, default USD) and `FieldType.TEXTAREA` on `FieldDefinition`; emit metadata in form/grid JSON; repository coercion. No web/mobile renderers (T24–T26).

## Decisions

- Follow P14-T20/T21 pattern: SDK types on `FieldDefinition`, metadata builder maps to `LayoutFieldType.CURRENCY` / `TEXTAREA`.
- `currency_code` optional on CURRENCY fields — defaults to `USD` when omitted; rejected on non-CURRENCY fields.
- Inventory examples: `PRODUCT.unit_price` → CURRENCY (USD); `PRODUCT.description` → TEXTAREA (full-width `span=12` in form metadata).
- Repository: CURRENCY coerced to `float`; TEXTAREA to `str`.

## What changed

| Path | Change |
|------|--------|
| `platform/api/src/emcap/entity/models.py` | `FieldType.CURRENCY`, `TEXTAREA`, `currency_code` validators |
| `platform/api/src/emcap/metadata/form_schema.py` | `LayoutFieldType.CURRENCY`, `TEXTAREA`, `currency_code` |
| `platform/api/src/emcap/metadata/grid_schema.py` | `currency_code` on grid columns |
| `platform/api/src/emcap/metadata/builder.py` | Map types; emit `currency_code`; textarea full span |
| `platform/api/src/emcap/persistence/repository.py` | Coerce CURRENCY/TEXTAREA values |
| `modules/inventory/module.py` | `unit_price` CURRENCY; `description` TEXTAREA |
| `platform/api/tests/test_system_fields.py` | `test_product_currency_and_textarea_field_metadata` |
| `platform/api/tests/test_entity_registry.py` | Currency contract unit tests |
| `platform/api/tests/test_inventory_e2e.py` | Grid column count 13 |
| Fixtures | `product.form.keys.json`, `product.grid.keys.json` |
| Docs | backlog, `07` matrix, traceability, codebase-index, plan/14, plan/16, plan/17 |

## Verification

```powershell
cd platform/api; python -m pytest tests/test_system_fields.py tests/test_inventory_e2e.py -q
# 21 passed
```

## Open follow-ups

- **P14-T23:** Builder validation polish; startup error surfacing for invalid field configs
- **P14-T24:** Web renderers (lookup picker, currency input, textarea)
- **P14-T25:** Mobile renderers
- **P14-T26:** Contract fixtures per field type
