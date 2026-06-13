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

**Examples**

| File | Milestone / task | Captured at |
|------|------------------|-------------|
| `phase14-product-grid-system-columns.png` | P14 system fields in grid | 1280×800, PRODUCT list |
| `phase14-product-detail-system-card.png` | P14 system section card | 1280×800, PRODUCT detail |
| `phase15-product-detail-hero.png` | P15-T06, M1 | 1280×800, hero header |
| `phase15-product-grid-polish.png` | P15-T06, M1 | 1280×800, grid polish |
| `phase15-mobile-product-detail.png` | P15-T13, M2 | Device frame optional |
| `phase17-workflow-inbox-web.png` | P17-T10 | Workflow inbox |
| `phase18-inventory-low-stock-report.png` | P18-T05 | Report run UX |

**Optional suffix** for theme or locale: append `-dark` or `-fr` before `.png` (e.g. `phase15-product-detail-hero-dark.png`). Default captures are **light** theme, **EN** locale.

---

## Capture settings

| Surface | Size / frame | Browser / device |
|---------|--------------|------------------|
| **Web** | 1280×800 viewport | Chrome; hide OS chrome; use in-app shell only |
| **Mobile** | Phone frame or 390×844 | Flutter emulator or device; same demo data as web |
| **Dark mode** | Same dimensions | Toggle theme before capture; filename `-dark` |

**Stack:** `scripts\run-emcap.bat --stack-only --local` (or Docker stack). Login as `admin`, tenant `default`. Demo seed on (`config/platform.yaml` → `seed.demo.enabled: true`).

**PRODUCT reference:** Inventory → Products (`entity_code` `PRODUCT`). Prefer 20-row demo catalog (`data/seed/demo/products.json`).

---

## M1 minimum pack (PRODUCT web)

Before marking M1 in `07-product-readiness-matrix.md`, capture at least:

1. `phase15-product-grid-polish.png` — list with multiple rows, search optional
2. `phase15-product-detail-hero.png` — selected row, hero + actions
3. `phase14-product-detail-system-card.png` — system section visible
4. `phase15-product-detail-hero-dark.png` — same detail in dark theme (or separate matrix row)

---

## Maintenance

- Replace screenshots when intentional UX changes ship; keep filenames stable when possible.
- If a slug is retired, add a one-line note in the PR — do not leave orphan names in playbooks.
- CI does not diff images yet; manual review in PR checklist (`plan/16-product-ready-dod.md` §1).

**Related:** `docs/dev/product-demo-runbook.md` · `plan/15-entity-page-redesign.md` · `plan/16-product-ready-dod.md`
