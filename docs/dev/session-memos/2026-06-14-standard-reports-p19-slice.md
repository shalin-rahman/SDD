# Standard report menus + P19 admin slice + CRM seed

**Date:** 2026-06-14

## 1 — P18-T05 standard reports (Done)

- `MenuDefinition.report_code` on platform model + `/api/v1/menus` response
- Report menu entries on INVENTORY, CRM, PROCUREMENT, SALES, ACCOUNTING, POS, HRM
- Web sidenav routes to `/app/reports?code=REPORT_CODE`
- `test_module_report_menus.py` (4 tests)
- Sprint script highlight selector fixed (`.reports-table__row--highlight`)

## 2 — P18-T06 CRM (Partial)

- `docs/modules/crm-definition-of-done.md`
- `data/seed/demo/crm.json` — 10 leads + 10 contacts (valid enum status)

## 3 — M2 mobile (still blocked)

- Flutter not on PATH; `scripts/capture-m2-mobile-screenshots.md` unchanged

## 4 — P19 admin slice (Partial)

- **P19-T01:** Settings mat-tab IA (Modules | Identity | Platform | Integrations)
- **P19-T02:** Admin users search, active chips, empty state

## Verification

- pytest `test_module_report_menus.py` — 4 passed (+ CRM tests in batch 10)
- Karma — **148/148**

No commit (user review).
