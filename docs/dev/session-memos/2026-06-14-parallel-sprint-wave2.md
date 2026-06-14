# Parallel sprint wave2 — screenshots + P18/P19/P15 slices

**Date:** 2026-06-14  
**Scope:** Doc/matrix sync after screenshot sprint and parallel agent completions. No commit (user review).

## Parallel completions

| Task | Surface | Outcome |
|------|---------|---------|
| **P18-T04** | Web + mobile | `STOCK_ADJUSTMENT` workflow on PRODUCT detail — submit/approve path |
| **P18-T05** | Web | Module report menus + LOW_STOCK via sidenav; `test_module_report_menus.py` |
| **P19-T01** | Web | Settings mat-tab IA — Modules \| Identity \| Platform \| Integrations |
| **P19-T02** | Web | Admin users search, active chips, empty state; roles search + empty; `admin-users.component.spec.ts` |
| **P15-T22** | Web Partial | Entity initial load + grid reload `app-loading-panel` |
| **P15-T23** | Web Done | `DynamicDataGridComponent` empty state + New CTA |

## Screenshot sprint (16 PNG wave2 + 5 M1 + account)

**Script:** `scripts/capture-screenshot-sprint.mjs`  
**Output:** `docs/product/screenshots/` — see `docs/product/screenshots/README.md` for full catalog.

Wave2 highlights:

- `phase18-inventory-low-stock-via-nav-web.png` — P18-T05 nav reachability
- `phase19-settings-ia-web.png` — P19-T01
- `phase19-admin-users-web.png` — P19-T02
- CRM + WAREHOUSE + stock movement grids/details (M4/M5 evidence)

## Matrix / backlog updates (this session)

- `spec/sdd/07-product-readiness-matrix.md` — M5/M6 partial; P15 loading/empty rows; LOW_STOCK nav; P19 admin **Demo** + screenshots; P18-T04 workflow note
- `plan/03-task-backlog.md` — phase 15/17/18/19 counts; P18-T05 nav Done; current focus → M6 partial
- `docs/product/screenshots/README.md` — all 22 PNGs indexed (5 M1 + 16 wave2 + account)

## Verification (prior agents)

- pytest `test_module_report_menus.py` — passed
- Karma admin-users spec — smoke passed
- Sprint script — 16 wave2 PNGs + account when stack on `:4200`

## Open follow-ups

- **M2** mobile screenshot pack (Flutter SDK on PATH)
- **P15-T22** mobile loading skeletons
- **P18-T06** CRM mobile Product-ready
- **P19-T03–T12** ABAC polish, branding preview, integrations/payments product UX
- Workflow inbox richer capture (seed instance) — optional
- Commit when user approves

## Re-run capture

```bat
scripts\start-emcap-local.bat
node scripts/capture-screenshot-sprint.mjs
```
