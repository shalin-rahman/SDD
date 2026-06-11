# Recipe — Entity search + pagination

## Checklist

1. Extend `listRecords` to pass `q` query param (API already supports search).
2. Web entity view — search input debounced → reload list.
3. Client-side page size (e.g. 25) with prev/next when API has no server pagination.
4. Mobile — `TextField` search + page controls in `entity_screen.dart`.
5. Update `05-end-user-matrix.md` search + pagination rows.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_platform_core_unchanged.py -k search
```
