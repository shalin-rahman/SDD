# Recipe — Form validation + field types

## Checklist

1. Read `FormFieldMetadata` from `contract.ts` — extend with `field_type`, `validation` if missing.
2. `DynamicFormRenderer` — map types: `text`, `number`, `date`, `select` to inputs.
3. On submit, validate required + type; show inline error under field.
4. Masked fields: render `••••` or disabled input when API omits value (field security).
5. Flutter parity in `metadata_contract.dart`.
6. Add vitest test for `isRequired` + type validation.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_metadata_workflow.py
cd clients/web; npm test
```
