# P17-T03 — Reports history web UX

**Date:** 2026-06-13  
**Task:** EMCAP-P17-T03

## Changes

- `GET /api/v1/reports/runs/{run_id}` — fetch stored run rows for CSV export
- `clients/web/src/app/pages/reports/` — catalog + history tables, running/failed states, Download CSV
- i18n EN/FR/BN; Karma spec; matrix 07 reports → Demo

## Verify

```bat
cd platform\api && python -m pytest tests/test_platform_services.py::test_report_list_and_run -q
cd clients\web && npm run test:ci -- --include=**/reports.component.spec.ts && npm run build
```
