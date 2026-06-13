# P14-T25 — Mobile field renderers (lookup, currency, textarea)

**Date:** 2026-06-13  
**Task:** EMCAP-P14-T25 (Slice 14B-S2)

## Goal

Flutter renderers for `lookup`, `currency`, and `textarea` field types in metadata-driven entity forms. Unit tests only (Flutter not on PATH in agent env).

## Decisions

- Reuse widgets started in prior pass: `LookupField` + `LookupPickerDialog`, `CurrencyField`, `TextareaField`.
- Wire in `entity_screen.dart` `_fieldInput` (edit/create flows); grid uses `columnFieldType` / `columnCurrencyCode`.
- i18n keys `field.lookup.*` added to mobile + web en/fr/bn for parity test.
- Lookup draft state in `_lookupValues`; currency coerced to `double` on save.

## What changed

| Path | Change |
|------|--------|
| `clients/mobile/lib/app/entity_screen.dart` | Wire lookup/currency/textarea/select renderers |
| `clients/mobile/lib/utils/field_display.dart` | Currency/textarea formatters |
| `clients/mobile/lib/utils/lookup_display.dart` | Import fix; column helpers |
| `clients/mobile/assets/i18n/*.json` | `field.lookup.*` keys |
| `clients/web/src/assets/i18n/*.json` | Matching keys for parity |
| `clients/mobile/test/field_display_test.dart` | **New** |
| `clients/mobile/test/lookup_display_test.dart` | **New** |
| `clients/mobile/test/metadata_contract_test.dart` | Lookup/currency/grid accessors |
| Docs | backlog, `05`/`07` matrices, traceability, codebase-index |

## Verification

```powershell
cd clients/mobile; flutter test
# Not run in agent env (Flutter not on PATH) — code + unit tests added
```

## Open follow-ups

- **P14-T26:** Contract fixtures per field type (API + web + mobile parity JSON)
