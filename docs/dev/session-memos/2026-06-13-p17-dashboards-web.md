# P17-T04 — Dashboard KPI cards web UX

**Date:** 2026-06-13  
**Task:** EMCAP-P17-T04

## Changes

- `clients/web/src/app/pages/dashboards/` — KPI card grid per dashboard; loading/error/empty via shared layout components; optional report link when `report_code` in widget metadata
- i18n EN/FR/BN; Karma spec (empty state); matrix 07 dashboards → Demo

## API gaps

- `GET /api/v1/dashboards` returns widget `code`, `label`, `metric`, `widget_type` only — no computed `value`, `icon`, `report_code`, or delta/trend fields. UI uses `metric` as value fallback, default Material icon `insights`, and shows report link only when metadata includes `report_code`.

## Verify

```bat
cd clients\web && npm run test:ci -- --include=**/dashboards.component.spec.ts && npm run build
```
