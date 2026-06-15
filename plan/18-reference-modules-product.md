# Phase 18 — Reference modules product depth

**Status:** Planned — S9–S10  
**Parent:** `plan/17-standard-product-execution-playbook.md` §10  
**DoD:** `docs/modules/inventory-definition-of-done-v2.md` · CRM: create `docs/modules/crm-definition-of-done.md` in P18-T06

**Driver (feedback C9, C12):** Modules pass API pytest but fail stakeholder demo bar.

---

## Reference entities

| Module | Primary | Secondary | Milestone |
|--------|---------|-----------|-----------|
| INVENTORY | PRODUCT | WAREHOUSE | M4 |
| CRM | LEAD | CONTACT | M5 |

---

## P18-T01 — Inventory DoD v2 — **Done**

`docs/modules/inventory-definition-of-done-v2.md`

---

## P18-T02 — PRODUCT seed — **Done**

`data/seed/demo/products.json` — 20+ rows, realistic SKUs/prices.

---

## P18-T03 — WAREHOUSE Product-ready

**Depends:** P15-T21 (entity redesign generalized or WAREHOUSE-specific rules).

**Acceptance:**

- Web + mobile entity page matches PRODUCT UX bar
- Grid + detail screenshots: `phase18-warehouse-grid-web.png`, `phase18-warehouse-detail-web.png`
- **Done (2026-06-14):** captured via `scripts/capture-screenshot-sprint.mjs`; M4 signed (web) in matrix 07
- `test_inventory_e2e.py` WAREHOUSE CRUD green

**Module work:** Ensure `modules/inventory/module.py` WAREHOUSE field defs include display hints when P15-T20 lands.

---

## P18-T04 — STOCK_ADJUSTMENT on PRODUCT detail — **Done**

**Depends:** P17-T01 (workflow inbox credible).

**Acceptance:**

- Header action “Start STOCK_ADJUSTMENT” visible when workflow enabled
- After start: workflow tab shows instance; link to inbox
- Mobile: same action in record header
- Screenshot on PRODUCT detail with workflow tab active

**Done (2026-06-14):** Web `RecordTabsComponent` workflow tab + platform-config gate; mobile workflow section + inbox link via shell nav.

---

## P18-T05 — Module report UX

**Depends:** P17-T03.

**Reports:**

- `LOW_STOCK` — run from Inventory menu or Reports; history + CSV
- `INVENTORY_VALUATION` — same pattern

**Acceptance:**

- Reachable from module-grouped nav (not buried)
- Screenshot: `phase18-inventory-low-stock-report.png`

**Progress (2026-06-14):** Reports reachable from module sidenav via `MenuDefinition.report_code` → `/app/reports?code=…`. Standard report menus on all business modules. Screenshot: `phase18-inventory-low-stock-report.png`.

---

## P18-T06 — CRM LEAD/CONTACT product

**Acceptance:**

- Entity redesign applied (P15-T21)
- Seed data: 10+ leads, 10+ contacts in `data/seed/demo/`
- Web + mobile Demo+ minimum; Product-ready if screenshots + checklist
- New doc: `docs/modules/crm-definition-of-done.md` (mirror inventory v2)

**Progress (2026-06-14):** Web LEAD/CONTACT Product-ready. Entity-pack screenshots refreshed on separate list/record routes (`--only=entity-packs`). Mobile: `entity_list_screen` + `entity_record_screen` with LEAD/CONTACT hero, status chip, read-only detail fields, grid formatters; unit tests in `record_headline_test.dart` / `field_display_test.dart`; device screenshot pending (Flutter SDK).

---

## P18-T07 — Menu icons + descriptions

**API:** Module menu metadata includes `icon` (Material icon name) and `description` key for i18n.

**Clients:** Shell renders icon in sidenav; tooltip or subtitle from description.

**Paths:** `modules/*/module.py` menu defs; `menus.py`; shell nav components.

---

## P18-T08 — Inventory product smoke script

**Deliverable:** `scripts/smoke-inventory-product.ps1` (and `.sh`) or extend `verify-platform-core`:

1. Login admin
2. List PRODUCT ≥20 rows
3. Open detail — hero visible
4. Update record — version increments
5. Soft delete + restore
6. Run LOW_STOCK report — CSV non-empty or documented empty
7. Exit 0

Document in `docs/dev/product-demo-runbook.md`.

---

## Traceability

| FR | Tasks |
|----|-------|
| FR-006 | T03–T05 |
| FR-017 | T03–T06 |
| FR-018, FR-019 | T06, T07 |

Update `spec/sdd/03-traceability-matrix.md` when M4 closes.
