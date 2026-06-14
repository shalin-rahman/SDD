# P20 W5 parallel completion + sequential follow-up

**Date:** 2026-06-13 (doc sync 2026-06-14)  
**Plan:** `plan/20-standard-entity-rollout.md` · Feedback **C14**

## Goal

Close W5 stock movement parallel tracks (web, mobile, API P20-T19) and doc-sync before W2/W4 sequential work.

## Parallel tracks completed (prior session)

| Track | Result |
|-------|--------|
| **Web** | 115/115 Karma — W5 fixtures + `entity-system.fixture.spec.ts` + `record-headline.util.ts` |
| **Mobile** | W4+W5 contract tests + headlines; `flutter test` skipped (Flutter not on PATH) |
| **API P20-T19** | `apply_posted_movement` Done — 97 pytest passed |

## Sequential follow-up (this session)

| Task | Status |
|------|--------|
| **P20-T15** W4 procurement/sales API profile | **Done** — modules verified; `test_procurement_sales_entity_fields.py` added |
| **P20-T16** W4 web/mobile fixtures | **Done** — web Karma; mobile loader W4; local Flutter skipped |
| **P20-T18** W5 UX | **Done (code)** — screenshots + local Flutter verify pending |
| **P20-T12** W2 API | **Done** — JE/SALE/LEAVE currency/lookup/enum + `test_w2_entity_fields.py` |

## Key paths

- `modules/procurement/module.py`, `modules/sales/module.py` — W4 standard profile
- `modules/accounting/module.py`, `modules/pos/module.py`, `modules/hrm/module.py` — W2 upgrades
- `platform/api/tests/test_procurement_sales_entity_fields.py`
- `platform/api/tests/test_w2_entity_fields.py`
- `clients/web/src/assets/fixtures/metadata/stock_movement*.json`
- `clients/mobile/test/support/entity_fixtures.dart` — W4+W5 entity codes

## Verification

```powershell
cd platform\api
python -m pytest tests/test_procurement_sales_entity_fields.py tests/test_w2_entity_fields.py tests/test_stock_movement_entities.py -q
# 16 new + existing W5 tests pass
```

Web unchanged in W2 API work — no `npm run test:ci` rerun required.

## Next sequential

1. **P20-T13** — W2 web/mobile fixture parity (JE, SALE, LEAVE)
2. **P20-T14** — W3 ACCOUNT/TERMINAL/EMPLOYEE status + fixtures
3. W5 screenshot pack + M4 inventory sign-off
4. Seed data for W2/W4 demo records if needed for manual QA
