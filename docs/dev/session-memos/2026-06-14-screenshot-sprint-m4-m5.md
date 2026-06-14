# Screenshot sprint — M4/M5 evidence (P17-T10 + P18)

**Date:** 2026-06-14  
**Script:** `scripts/capture-screenshot-sprint.mjs`  
**Stack:** `scripts/start-emcap-local.bat` (SQLite + uvicorn + ng serve)

## Captured (14 PNG)

### P17 platform services
- `phase17-workflow-inbox-web.png` — empty state + Open Products CTA
- `phase17-reports-history-web.png`
- `phase17-dashboards-web.png`
- `phase17-notifications-web.png`
- `phase17-account-profile-web.png`

### P18 inventory / reports
- `phase18-inventory-low-stock-report.png` — `?code=LOW_STOCK` (row highlight warn: selector not matched)
- `phase18-warehouse-grid-web.png` / `phase18-warehouse-detail-web.png`

### W5 stock movement
- `phase20-stock-movement-grid-web.png` / `phase20-stock-movement-detail-web.png`

### P18 CRM
- `phase18-crm-lead-grid-web.png` / `phase18-crm-lead-detail-web.png`
- `phase18-crm-contact-grid-web.png` / `phase18-crm-contact-detail-web.png`

## Matrix / backlog

- **M4** signed (web) — PRODUCT + WAREHOUSE
- **M5** partial — services + CRM web evidence
- P17-T10 Done · P18-T03 Done · P18-T05/T06 Partial

## Open follow-ups

- Workflow inbox empty — seed workflow instance for richer capture (optional)
- LOW_STOCK row highlight CSS selector in sprint script
- P18-T05 inventory nav menu links for reports
- P18-T06 `crm-definition-of-done.md` + mobile screenshots
- M2 mobile screenshot pack (Flutter SDK)

## Re-run

```bat
scripts\start-emcap-local.bat
node scripts/capture-screenshot-sprint.mjs
```
