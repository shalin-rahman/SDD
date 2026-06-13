# P14-T23 — Metadata field validation (startup + builder)

**Date:** 2026-06-13  
**Task:** EMCAP-P14-T23 (Slice 14B-S2)

## Goal

Formalize LOOKUP/CURRENCY/ENUM field-config validation at module startup (`registry.validate()`) and metadata build time (`build_form_metadata` / `build_grid_metadata`). No web/mobile renderers.

## Decisions

- Centralize in `metadata/validation.py` — single source for field-type contracts.
- Registry wraps `MetadataValidationError` as `EntityRegistryError` → app fails to boot on bad module config (`main.py` calls `registry.validate()`).
- Builder calls validation before emitting JSON (defense in depth if builder invoked outside startup path).
- Added checks: self-referential LOOKUP, unknown lookup target, missing `currency_code`, empty ENUM `options`; pydantic guards for misplaced `options`/`lookup_entity`/`currency_code`.

## What changed

| Path | Change |
|------|--------|
| `platform/api/src/emcap/metadata/validation.py` | **New** — `validate_field_for_metadata`, `validate_entity_for_metadata` |
| `platform/api/src/emcap/entity/registry.py` | Delegate field-type checks to validation module |
| `platform/api/src/emcap/metadata/builder.py` | Call validation at start of form/grid build |
| `platform/api/src/emcap/entity/models.py` | ENUM requires non-empty `options`; reject `options` on non-ENUM |
| `platform/api/tests/test_metadata_validation.py` | **New** — edge-case pytest suite |
| Docs | backlog, `07` matrix, traceability, codebase-index, plan/14, plan/16, plan/17 |

## Verification

```powershell
cd platform/api; python -m pytest tests/test_system_fields.py tests/test_entity_registry.py tests/test_inventory_e2e.py -q
# 27 passed
```

## Open follow-ups

- **P14-T24:** Web renderers (lookup picker, currency input, textarea)
- **P14-T25:** Mobile renderers
- **P14-T26:** Contract fixtures per field type
