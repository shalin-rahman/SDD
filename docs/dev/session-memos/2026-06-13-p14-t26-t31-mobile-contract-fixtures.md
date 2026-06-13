# P14-T26 + P14-T31 — Mobile contract fixtures (code-only)

**Date:** 2026-06-13  
**Tasks:** EMCAP-P14-T26, EMCAP-P14-T31  
**Flutter run:** skipped (SDK not on PATH)

## Delivered

- `columnLookupEntity` on `DynamicGridRenderer` (parity with web grid metadata)
- `field_types_fixture.dart` — loads `product.field-types.json` + `product.grid.keys.json`; builds grid from fixture
- `field_types_fixture_test.dart` — grid column accessor tests
- `system_fields_contract_test.dart` — system section read-only fields, grid keys, datetime format, draft exclusion
- Fixed missing `document_preview_dialog.dart` import in `entity_screen.dart`
- Fixed pytest repo-root path (`FIXTURES.parents[4]`) in `test_system_fields.py`

## Verify (no Flutter)

```bat
cd platform\api
python -m pytest tests/test_system_fields.py -q
```

Flutter tests (when SDK available): `cd clients/mobile && flutter test`

## Next

- P17-T11 Rule evaluate panel (web)
- P17-T10 Service UX screenshots
- M2 mobile PNG capture (Flutter SDK required)
