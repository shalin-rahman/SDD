# P14-T24 — Web field renderers (lookup, currency, textarea)

**Date:** 2026-06-13  
**Task:** EMCAP-P14-T24 (Slice 14B-S2)

## Goal

Web renderers for `lookup`, `currency`, and `textarea` field types in metadata-driven forms. Karma specs per renderer. Mobile deferred to P14-T25.

## Decisions

- Reusable components under `shared/forms/`; `DynamicFormViewComponent` composes them (pages stay thin).
- Lookup: `LookupFieldComponent` + `LookupPickerDialogComponent` (MatDialog, search via `listRecords`).
- Currency: `CurrencyFieldComponent` with mat-form-field label = `currency_code`.
- Textarea: native `<textarea>` in form view with full-width styling.
- Grid: `formatGridCellValue` + `DynamicGridRenderer.columnFieldType` for currency/textarea display.

## What changed

| Path | Change |
|------|--------|
| `clients/web/src/app/metadata/contract.ts` | `lookup_entity`, `currency_code` on form/grid metadata |
| `clients/web/src/app/metadata/dynamic-form.renderer.ts` | Currency validation; createInputElement for new types |
| `clients/web/src/app/metadata/dynamic-grid.renderer.ts` | Column field type + currency code accessors |
| `clients/web/src/app/shared/forms/lookup-field.component.*` | Lookup picker trigger |
| `clients/web/src/app/shared/forms/lookup-picker-dialog.component.*` | Modal search/select |
| `clients/web/src/app/shared/forms/currency-field.component.*` | Currency input |
| `clients/web/src/app/shared/forms/dynamic-form-view.component.*` | Wire new renderers |
| `clients/web/src/app/shared/utils/field-display.util.ts` | Currency/textarea formatters |
| `clients/web/src/app/shared/utils/lookup-display.util.ts` | Record label helper |
| Specs | lookup, currency, field-display, dynamic-form.renderer |
| Docs | backlog, `05`/`07` matrices, shared README, codebase-index |

## Verification

```powershell
cd clients/web; npm run test:ci; npm run build
# 52 Karma SUCCESS; build OK
```

## Open follow-ups

- **P14-T25:** Mobile lookup/currency/textarea renderers
- **P14-T26:** Contract fixtures per field type
