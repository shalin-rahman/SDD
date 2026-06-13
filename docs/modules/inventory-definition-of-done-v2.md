# Inventory Module — Definition of Done v2 (product criteria)

**Task:** EMCAP-P18-T01  
**Supersedes API-only sign-off:** `inventory-definition-of-done.md` (Phase 5 / SDD §30 API checklist remains valid; this doc adds **product** gates)  
**Module:** `INVENTORY` · **Reference entities:** `PRODUCT` (primary), `WAREHOUSE`  
**Gate:** `plan/16-product-ready-dod.md` · `spec/sdd/07-product-readiness-matrix.md`

---

## 1. What v2 adds

| v1 (API DoD) | v2 (product DoD) |
|--------------|------------------|
| Routes exist and pytest green | Stakeholder demo without apologizing for UX |
| 2 demo rows sufficient | **20+** realistic catalog rows (`data/seed/demo/products.json`) |
| Grid + form wired | Hero header, section cards, loading/error/empty states |
| Matrix 04/05 Done | Matrix **07** Product-ready per entity + surface |
| No screenshot requirement | Screenshot pack per `docs/product/screenshots/README.md` |

---

## 2. PRODUCT — product criteria (M1 / M4)

### Data & API

- [ ] System fields in metadata and UI: `created_at`, `updated_at`, `created_by`, `updated_by`, `record_version`, `deleted_at`
- [ ] List excludes soft-deleted rows by default; restore path documented
- [ ] PUT with stale `If-Match` returns **409**; UI shows recoverable error
- [ ] Search debounced; works on SKU and name
- [ ] Field security: system fields not client-writable

### Web UX (1280px reference)

- [ ] Nav: Inventory → Products (module-grouped sidenav)
- [ ] Grid: 20 rows readable; sticky header; formatted datetimes; export CSV
- [ ] Detail: `SKU — Name` hero; active/inactive chip; actions in header
- [ ] Business vs system sections visually distinct; system hidden on create
- [ ] Notes, documents, audit tabs functional on selected record
- [ ] Light + dark theme; EN / FR / BN labels (no raw i18n keys)
- [ ] Screenshots: M1 minimum pack (see screenshots README)

### Mobile UX (M2)

- [ ] Same metadata contract as web
- [ ] Record detail header parity with web hero pattern
- [ ] Master–detail back stack on phone width
- [ ] Mobile screenshot: `phase15-mobile-product-detail.png` (or equivalent)

### Tests

- [ ] `test_inventory_e2e.py` — CRUD, metadata, reports, workflow
- [ ] `test_system_fields.py` — version conflict, soft delete, restore
- [ ] Web `npm run test:ci` — entity/shared component specs
- [ ] `flutter test` — metadata contract

---

## 3. WAREHOUSE — product criteria (M4)

- [ ] Entity page redesign applied (P15-T21 pattern)
- [ ] Grid + detail Product-ready in matrix 07 (web + mobile)
- [ ] Linked conceptually to PRODUCT (lookup field when P14-B LOOKUP ships)
- [ ] Demo seed: `data/seed/demo/warehouses.json` — multiple sites

---

## 4. Module services (demo+ bar, M4 / M5)

| Capability | Product criterion | Evidence |
|------------|-------------------|----------|
| **STOCK_ADJUSTMENT** workflow | Start from PRODUCT detail; visible in inbox | Workflow tab + P17 inbox UX |
| **LOW_STOCK** report | Run from Reports; credible rows from seed | Report UX + pytest filter |
| **INVENTORY_VALUATION** report | CSV/download UX | Report run history |
| **INVENTORY_OVERVIEW** dashboard | KPI cards not raw JSON | Dashboard widgets P17-T04 |
| **Menus** | Icons + descriptions (P18-T07) | `GET /api/v1/menus` |
| **Permissions** | `inventory.access` enforced in UI | 403 message, not blank page |
| **Stock movements (W5)** | `STOCK_MOVEMENT` with standard types (receive, return, gift, …) | `plan/20-standard-entity-rollout.md` §1.5 · P20-T17–T19 — **post-M4** |

---

## 5. Seed & demo

- [ ] `products.json` — ≥20 records, varied SKUs, prices, stock levels, ≥1 inactive
- [ ] `product-demo-runbook.md` — scripted path verified quarterly
- [ ] E2E smoke: `EMCAP-P18-T08` (inventory product smoke script) when added

---

## 6. Architecture (unchanged from v1)

- [ ] No inventory business logic in `platform/api/src/emcap/` outside generic entity APIs
- [ ] Module definition only in `modules/inventory/module.py`
- [ ] `test_platform_core_unchanged.py` green

---

## 7. Sign-off table (product)

| Item | Owner | Product-ready | Date | Evidence |
|------|-------|---------------|------|----------|
| PRODUCT web | Module + UX | ☐ | | `07` matrix + screenshots |
| PRODUCT mobile | Module + UX | ☐ | | `07` matrix + screenshot |
| WAREHOUSE web + mobile | Module | ☐ | | `07` matrix |
| Module services Demo+ | Module | ☐ | | P17 + runbook |
| Seed catalog 20+ | Module | ☐ | | `products.json` |
| v2 doc complete | Product | ☐ | | This file |

**Overall module product status:** **Not signed** — complete M1 (PRODUCT web) before WAREHOUSE and CRM depth.

---

## 8. Re-verify commands

```bash
# API + inventory
cd platform/api && pytest -q tests/test_inventory_e2e.py tests/test_system_fields.py

# Web
cd clients/web && npm run test:ci && npm run build

# Mobile
cd clients/mobile && flutter test test/metadata_contract_test.dart

# Manual demo
# docs/dev/product-demo-runbook.md
```

**v1 API checklist:** `docs/modules/inventory-definition-of-done.md`
