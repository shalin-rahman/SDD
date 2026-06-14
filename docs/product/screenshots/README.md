# Product screenshots (EMCAP-P20-T01)

Evidence images for **Product-ready** gates in `plan/16-product-ready-dod.md` and milestone sign-off in `plan/16-standard-viable-system.md`.

**Do not** commit secrets, real customer data, or unmasked API keys. Use demo seed (`admin` / `admin123`, tenant `default`).

---

## Folder

All screenshots live in this directory:

```
docs/product/screenshots/
```

Reference paths in PRs, `spec/sdd/07-product-readiness-matrix.md`, and phase playbooks — not external attachments.

**Inventory:** 25+ PNG files — 5 M1 PRODUCT + sprint wave2 pack + P18 workflow tab + P19 admin security field-access + account profile.

---

## Naming convention

```
<phase>-<surface>-<slug>.png
```

| Part | Values | Notes |
|------|--------|-------|
| `phase` | `phase14`, `phase15`, `phase16`, `phase17`, `phase18`, `phase19`, `phase20` | Phase or workstream that owns the UX bar |
| `surface` | `web`, `mobile`, `api` (rare) | Primary client; use one file per surface |
| `slug` | kebab-case, ≤40 chars | What the image shows |

**Optional suffix** for theme or locale: append `-dark` or `-fr` before `.png` (e.g. `phase15-product-detail-hero-dark.png`). Default captures are **light** theme, **EN** locale.

---

## M1 — PRODUCT web minimum pack (5)

Captured on **separate routes** (Slice 15C): grid PNGs from list route `/app/entity/PRODUCT`; detail PNGs after row navigate to record route.

| Filename | Route / scene | Task / milestone |
|----------|---------------|------------------|
| `phase14-product-grid-system-columns.png` | `/app/entity/PRODUCT` — grid with system columns | P14 system fields in grid |
| `phase14-product-detail-system-card.png` | PRODUCT detail — system section card | P14 system section |
| `phase15-product-detail-hero.png` | PRODUCT detail — hero header + actions | P15-T06, **M1** |
| `phase15-product-grid-polish.png` | PRODUCT grid — zebra rows, sticky header | P15-T06, **M1** |
| `phase15-product-detail-hero-dark.png` | Same PRODUCT detail in dark theme | P15-T06, **M1** |

---

## Sprint wave2 — 16 PNG pack (M4 / M5 / M6)

Captured 2026-06-14 via `scripts/capture-screenshot-sprint.mjs` after parallel agents completed P17-T10, P18-T03/T05/T06, P18-T04, P19-T01/T02, and P20-T18 stock movement UX.

### P17 — Platform services (4)

| # | Filename | Route / scene | Task |
|---|----------|---------------|------|
| 1 | `phase17-workflow-inbox-web.png` | `/app/workflow` — filter row + empty state with Open Products CTA | P17-T01, P17-T10 |
| 2 | `phase17-reports-history-web.png` | `/app/reports` — catalog + run history with completed row | P17-T03, P17-T10 |
| 3 | `phase17-dashboards-web.png` | `/app/dashboards` — KPI card grid (Inventory Overview) | P17-T04, P17-T10 |
| 4 | `phase17-notifications-web.png` | `/app/notifications` — list with channel icons | P17-T05, P17-T10 |

### P17 — Account hub (1, same script run)

| Filename | Route / scene | Task |
|----------|---------------|------|
| `phase17-account-profile-web.png` | `/app/account` — profile + preferences | P17-T08, P17-T10 |

### P18 — Inventory reports + WAREHOUSE (4)

| # | Filename | Route / scene | Task |
|---|----------|---------------|------|
| 5 | `phase18-inventory-low-stock-report.png` | `/app/reports?code=LOW_STOCK` — highlighted row + run history | P18-T05 |
| 6 | `phase18-inventory-low-stock-via-nav-web.png` | Sidenav **Low Stock Report** link → reports page | P18-T05 module report menus |
| 7 | `phase18-warehouse-grid-web.png` | `/app/entity/WAREHOUSE` — grid | P18-T03 |
| 8 | `phase18-warehouse-detail-web.png` | WAREHOUSE selected row — hero + form | P18-T03 |

### P20 — Stock movement (W5) (2)

| # | Filename | Route / scene | Task |
|---|----------|---------------|------|
| 9 | `phase20-stock-movement-grid-web.png` | `/app/entity/STOCK_MOVEMENT` — grid | P20-T18 |
| 10 | `phase20-stock-movement-detail-web.png` | STOCK_MOVEMENT selected row | P20-T18 |

### P18 — CRM reference (4)

| # | Filename | Route / scene | Task |
|---|----------|---------------|------|
| 11 | `phase18-crm-lead-grid-web.png` | `/app/entity/LEAD` — grid | P18-T06 |
| 12 | `phase18-crm-lead-detail-web.png` | LEAD selected row | P18-T06 |
| 13 | `phase18-crm-contact-grid-web.png` | `/app/entity/CONTACT` — grid | P18-T06 |
| 14 | `phase18-crm-contact-detail-web.png` | CONTACT selected row | P18-T06 |

### P19 — Admin / settings (3)

| # | Filename | Route / scene | Task |
|---|----------|---------------|------|
| 15 | `phase19-settings-ia-web.png` | `/app/settings` — mat-tab IA (Modules \| Identity \| Platform \| Integrations) | P19-T01 |
| 16 | `phase19-admin-users-web.png` | `/app/admin/users` — search, active chips, table or empty state | P19-T02 |
| 17 | `phase19-admin-security-field-access-web.png` | `/app/admin/security` — field matrix + edit panel | P19-T03 |

### P18 — PRODUCT workflow (1)

| Filename | Route / scene | Task |
|----------|---------------|------|
| `phase18-product-workflow-tab-web.png` | PRODUCT record route — Workflow tab after STOCK_ADJUSTMENT | P18-T04 |

---

## Capture settings

| Surface | Size / frame | Browser / device |
|---------|--------------|------------------|
| **Web** | 1280×800 viewport | Chrome; hide OS chrome; use in-app shell only |
| **Mobile** | Phone frame or 390×844 | Flutter emulator or device; same demo data as web |
| **Dark mode** | Same dimensions | Toggle theme before capture; filename `-dark` |

**Stack:** `scripts\start-emcap-local.bat` (SQLite + uvicorn + ng serve). Login as `admin`, tenant `default`. Demo seed on (`config/platform.yaml` → `seed.demo.enabled: true`).

**Sprint script (wave2 pack):**

```bat
scripts\start-emcap-local.bat
node scripts/capture-screenshot-sprint.mjs
node scripts/capture-screenshot-sprint.mjs --only=entity-packs
node scripts/capture-screenshot-sprint.mjs --only=product-workflow
node scripts/capture-screenshot-sprint.mjs --only=admin-security
```

Entity-pack only refreshes WAREHOUSE, STOCK_MOVEMENT, LEAD, CONTACT grid + detail PNGs (Slice 15C separate routes).

Install Playwright Chromium once: `npx --yes playwright@1.49.1 install chromium`

---

## Maintenance

- Replace screenshots when intentional UX changes ship; keep filenames stable when possible.
- If a slug is retired, add a one-line note in the PR — do not leave orphan names in playbooks.
- CI does not diff images yet; manual review in PR checklist (`plan/16-product-ready-dod.md` §1).

**Related:** `docs/dev/product-demo-runbook.md` · `plan/15-entity-page-redesign.md` · `plan/16-product-ready-dod.md` · `docs/dev/session-memos/2026-06-14-parallel-sprint-wave2.md`
