# Recipe — Record edit in client shells

## Checklist

1. On record select, fetch `getRecord(entity, id)` and pre-fill form fields.
2. Toggle create form to **Edit** mode (disable create, show Save/Cancel).
3. Save → `updateRecord(entity, id, payload)` → refresh grid + detail.
4. Mirror flow in `entity_screen.dart`.
5. Update `spec/sdd/05-end-user-matrix.md` edit row → Done.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_crm_e2e.py tests/test_inventory_e2e.py
cd clients/web; npm run lint; npm test
cd clients/mobile; flutter test
```
