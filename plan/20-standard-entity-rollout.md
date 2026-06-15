# Plan 20 — Standard entity rollout (API · Web · Mobile · Tests)

**Status:** Active — 2026-06-14  
**Driver:** User request — close all gaps vs standard enterprise entity profile on **every registered entity**; no re-planning per task.  
**Feedback:** `docs/product/user-feedback-registry.md` C1, C9, C10, C12, **C14**, A2, A7, A12, A14  
**Gate:** `spec/sdd/07-product-readiness-matrix.md` · `plan/16-product-ready-dod.md`  
**Do not commit** unless user explicitly asks.

---

## 0. Standard profile (checklist — every entity)

| # | Requirement | Layer | Wave |
|---|-------------|-------|------|
| S1 | Platform system fields in form + grid metadata | API | ✅ platform Done — verify all |
| S2 | `created_by` / `updated_by` / version / soft delete on CRUD | API | ✅ — verify all |
| S3 | Reject system-field injection on create/update | API | ✅ — verify all |
| S4 | Business **natural key** field (code / sku / no.) | Module | W1–W3 |
| S5 | Business **display name** field | Module | ✅ all have one |
| S6 | **`active` boolean** | Module | ✅ all |
| S7 | **`status_field` display contract** → hero chip | Module + API metadata | W1 |
| S8 | **Enum** for status/category (not free string) | Module | W1–W2 |
| S9 | **Lookup** for FK relationships | Module + save validation | W1–W2 |
| S10 | **Currency** for money (not raw decimal) | Module | W2 |
| S11 | **Textarea** for long text where needed | Module | W2 |
| S12 | **Email** layout + validation (`name==email`) | Module | ✅ CRM/Demo |
| S13 | EntityOptions: audit, notes, workflow, documents as appropriate | Module | W3 polish |
| S14 | BN i18n labels in metadata builder | API | W1–W3 |
| S15 | JSON fixture `tests/fixtures/metadata/{entity}.*.json` | Tests | W1 |
| S16 | Parametrized pytest system-section + grid columns | Tests | W1 (**P20-T05**) |
| S17 | Web Karma fixture parity spec | Tests | W1 |
| S18 | Mobile Dart fixture loader + contract test | Tests | W1 |
| S19 | Generic entity UX (system card, formatters, renderers) | Web + Mobile | ✅ generic |
| S20 | Product-ready screenshot + matrix row | Web + Mobile | W1–W3 |

**Waves**

| Wave | Entities | Milestone |
|------|----------|-----------|
| **W1** | PRODUCT (maintain), WAREHOUSE, CUSTOMER, LEAD, CONTACT | M4 + M5 |
| **W2** | JOURNAL_ENTRY, SALE, LEAVE_REQUEST | Module depth |
| **W3** | ACCOUNT, TERMINAL, EMPLOYEE | Demo parity |
| **W4** | SUPPLIER, PURCHASE_ORDER, SALES_ORDER, INVOICE | M5+ (order chain) |
| **W5** | **STOCK_MOVEMENT**, **STOCK_MOVEMENT_LINE** (+ movement types) | M4 extension |

**W4 note:** Module defs exist — `modules/procurement/module.py` (SUPPLIER, PURCHASE_ORDER), `modules/sales/module.py` (SALES_ORDER, INVOICE). W4 applies standard profile (S4–S14) + fixtures; no new entity types.

**W5 note:** Stock **movement types** are new inventory capability (feedback **C14**). Distinct from existing `STOCK_ADJUSTMENT` **workflow** on PRODUCT (`modules/inventory/module.py`) — workflow approves changes; STOCK_MOVEMENT is the transactional document + type enum.

---

## Section 1 — API

> **Owner path:** `platform/api/`, `modules/*/module.py`  
> **Verify:** `cd platform\api && python -m pytest tests/test_entity_system_contract.py tests/test_system_fields.py tests/test_inventory_e2e.py -q`

### 1.1 Platform (no module edits)

| Task ID | Work | Paths | Done when |
|---------|------|-------|-----------|
| P20-T05 | Parametrized **all-entity** system metadata contract | `tests/test_entity_system_contract.py` (**new**) | Every `registry.list_codes()` has `main`+`system` sections, grid system columns |
| — | Lookup save-time validation | `persistence/repository.py`, `api/routes/entities.py` | ✅ Done |
| — | Field types ENUM/LOOKUP/CURRENCY/TEXTAREA | `entity/models.py`, `metadata/*` | ✅ Done |

### 1.2 Module field definitions (per entity)

Apply **`StatusFieldDisplay`** on `EntityOptions` for every entity with `active`.

| Entity | Add / change fields | `status_field` | Notes |
|--------|---------------------|----------------|-------|
| **PRODUCT** | — | ✅ `active` | Reference; keep |
| **WAREHOUSE** | — | ✅ `active` | W1 Done |
| **CUSTOMER** | ☐ optional `code` string | ✅ `active` | W1 Done (code deferred) |
| **LEAD** | ✅ `status` → **ENUM** | ✅ `active` | W1 Done |
| **CONTACT** | ✅ `lead_id` **LOOKUP** → LEAD | ✅ `active` | W1 Done |
| **ACCOUNT** | ✅ `balance` → **CURRENCY** USD | ✅ `active` | W3 Done |
| **JOURNAL_ENTRY** | ✅ `account_id` LOOKUP→ACCOUNT; `amount` CURRENCY | ✅ `active` | W2 Done |
| **SALE** | ✅ `total` CURRENCY; `terminal_id` LOOKUP→TERMINAL | ✅ `active` | W2 Done |
| **TERMINAL** | — | ✅ `active` | W3 Done |
| **EMPLOYEE** | ✅ `department` ENUM | ✅ `active` | W3 Done |
| **LEAVE_REQUEST** | ✅ `employee_id` LOOKUP→EMPLOYEE; `leave_type` ENUM | ✅ `active` | W2 Done |
| **SUPPLIER** | ✅ `code`, `email`; standard profile verified | ✅ `active` | W4 Done |
| **PURCHASE_ORDER** | ✅ lookups, status ENUM, currency | ✅ `status` | W4 Done |
| **SALES_ORDER** | ✅ lookups, status ENUM, currency | ✅ `status` | W4 Done |
| **INVOICE** | ✅ lookups, status ENUM, currency | ✅ `status` | W4 Done |
| **STOCK_MOVEMENT** | ✅ new entity — see §1.5 | ✅ `status` | **W5 Done** |
| **STOCK_MOVEMENT_LINE** | ✅ new child entity — see §1.5 | — | **W5 Done** |

**File:** always `modules/<module>/module.py` only — never `platform/` for business fields.

**i18n:** extend `FIELD_BN_LABELS` in `metadata/builder.py` for new field names.

### 1.3 API tests (per wave)

| Test file | Covers |
|-----------|--------|
| `test_entity_system_contract.py` | S1–S3 all entities |
| `tests/fixtures/metadata/{entity}.form.keys.json` | Business field name snapshot |
| `tests/fixtures/metadata/{entity}.grid.keys.json` | Column snapshot |
| `test_system_fields.py` | PRODUCT advanced types + lookup validation |
| `test_inventory_e2e.py` | PRODUCT + WAREHOUSE CRUD |
| `test_crm_entity_fields.py` (**new**, W1) | LEAD enum, CONTACT lookup, status metadata |
| `test_stock_movement_entities.py` (**new**, W5) | CRUD, movement_type enum metadata, line validation, transfer rules |
| `test_procurement_sales_entity_fields.py` (**new**, W4) | SUPPLIER/PO/SO/INVOICE standard profile |
| `test_w2_entity_fields.py` (**new**, W2) | JOURNAL_ENTRY, SALE, LEAVE_REQUEST currency/lookup/enum |
| `test_w3_entity_fields.py` (**new**, W3) | ACCOUNT, TERMINAL, EMPLOYEE currency/enum/status + CRUD smoke |

### 1.4 API wave execution order

```
W1-A  P20-T05 parametrized system contract (all 11)
W1-B  WAREHOUSE + CUSTOMER status_field
W1-C  LEAD enum status + status_field
W1-D  CONTACT lead_id lookup + status_field
W1-E  Fixtures for WAREHOUSE, LEAD, CONTACT, CUSTOMER
W2    JOURNAL_ENTRY, SALE, LEAVE_REQUEST module fields + tests
W3    ACCOUNT, TERMINAL, EMPLOYEE status + remaining
W4    SUPPLIER, PURCHASE_ORDER, SALES_ORDER, INVOICE standard profile + fixtures (P20-T15/T16)
W5    STOCK_MOVEMENT + STOCK_MOVEMENT_LINE entities, movement_type enum, tests, seed, report (P20-T17–T19 Done)
```

### 1.5 W5 — Stock movement entity design (API)

**Owner:** `modules/inventory/module.py` only. Generic platform hook: modules may export `ENTITY_VALIDATORS` (business rules only).

#### Locked decisions (2026-06-14 — industry ERP standard)

| # | Topic | Decision |
|---|--------|----------|
| D1 | **Transfer model** | **Single document** with `source_warehouse_id` + `warehouse_id` (destination). One `STOCK_MOVEMENT` per transfer; lines apply to both warehouses on post (P20-T19). Same pattern as SAP/Odoo/NetSuite STO. |
| D2 | **Qty on hand application** | **Module domain service** in `modules/inventory/stock_movement.py` (`apply_posted_movement`), **not** a platform post-hook. Trigger on status transition `draft → posted` via module rule/formula (P20-T19). Platform persistence stays generic. |
| D3 | **Order lines** | W5 uses **LOOKUP parent** on `STOCK_MOVEMENT_LINE` (`movement_id` → `STOCK_MOVEMENT`). Full PO/SO **line entities** deferred to a future wave — out of scope for W5. |
| D4 | **Workflow on post** | **Draft / Posted / Cancelled** lifecycle **without mandatory approval** for standard movements. Optional workflow hook may be feature-flagged later (`config/platform.yaml`). Routine receive/issue/adjustment post immediately. |

#### Movement type enum (`movement_type` on STOCK_MOVEMENT)

| Code | Direction | Typical use |
|------|-----------|-------------|
| `receive` | In (+) | Goods in from supplier / PO receipt |
| `return` | In (+) | Customer return to stock |
| `bonus` | In (+) | Free goods / supplier bonus stock |
| `gift` | Out (−) | Promotional or sample issue |
| `damage` | Out (−) | Damaged goods write-off |
| `lost` | Out (−) | Shrinkage, theft, unexplained loss |
| `transfer` | Both | Inter-warehouse move — **D1:** one header, `warehouse_id` = destination, `source_warehouse_id` = origin (required) |
| `adjustment` | Both | Manual qty correction (pairs with `STOCK_ADJUSTMENT` workflow approval) |
| `issue` | Out (−) | Sales shipment / internal consumption |

**Open decision (post-W5):** whether `transfer` posts as one document with two warehouse lookups or paired documents — default **one header** with `warehouse_id` (destination) + `source_warehouse_id` (origin).

#### STOCK_MOVEMENT (header)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `movement_number` | STRING | yes | Natural key (S4) |
| `movement_type` | ENUM | yes | Values above |
| `movement_date` | DATE | yes | Business date |
| `warehouse_id` | LOOKUP → WAREHOUSE | yes | Primary / destination warehouse |
| `source_warehouse_id` | LOOKUP → WAREHOUSE | no | **Required when `movement_type=transfer`** (D1); validated via `modules/inventory/stock_movement.py` |
| `reference_type` | ENUM | no | `manual`, `purchase_order`, `sales_order`, `stock_adjustment` |
| `reference_id` | STRING | no | External doc id / number |
| `notes` | TEXTAREA | no | |
| `status` | ENUM | yes | `draft`, `posted`, `cancelled` |
| `active` | BOOLEAN | no | Standard (S6) |

`EntityOptions`: audit, notes, documents (receipt photos); **D4:** `workflow_enabled=False` on header (no mandatory approval); `status_field` on `status`.

#### STOCK_MOVEMENT_LINE (detail)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `movement_id` | LOOKUP → STOCK_MOVEMENT | yes | Parent |
| `product_id` | LOOKUP → PRODUCT | yes | |
| `quantity` | DECIMAL | yes | Always positive; sign derived from `movement_type` on post (D2, P20-T19) |
| `unit_cost` | CURRENCY | no | For receive/bonus valuation |

**Menus:** Inventory → Stock Movements (header grid); lines via record tabs or inline child grid (metadata-driven — same pattern as future order lines).

**Reports (W5 polish):** ✅ `STOCK_MOVEMENT_HISTORY` — movement_number, movement_type, warehouse_id, status, movement_date (`modules/inventory/module.py`). Demo seed: `data/seed/demo/stock_movements.json` (draft + posted receive/issue/transfer with lines; requires `warehouses.json` + `products.json`).

**Demo seed (P20-T19):** `data/seed/demo/stock_movements.json` — 5 headers (2 draft, 3 posted) + 5 lines; second warehouse in `warehouses.json` for transfer examples. Loaded via existing demo seed loader (`apply_demo_seed` scans all `*.json` in `data/seed/demo/`).

**i18n:** BN labels for all movement types in `metadata/builder.py` `FIELD_BN_LABELS`.

---

## Section 2 — Web

> **Owner path:** `clients/web/src/app/` — reusable in `shared/`; pages thin  
> **Verify:** `cd clients\web && npm run test:ci && npm run build`

### 2.1 Generic (already works for all entities — verify only)

| Capability | Path | Task |
|------------|------|------|
| System section card | `shared/forms/dynamic-form-view.component.*` | Verify |
| Datetime/currency/lookup/textarea renderers | `shared/forms/*`, `shared/utils/field-display.util.ts` | Verify |
| Status chip from metadata | `shared/utils/record-headline.util.ts` → `buildStatusChipView` | Verify |
| Grid system columns | `shared/data/dynamic-data-grid.component.*` | Verify |
| If-Match on save | `pages/entity/entity-record.component.ts` | Verify |
| Soft delete restore | `pages/entity/entity-record.component.ts` | Verify |

### 2.2 Per-entity web work

| Task ID | Work | Paths | Wave |
|---------|------|-------|------|
| P15-T20 | Hero headline from metadata hints (not hard-coded PRODUCT) | `shared/utils/record-headline.util.ts`, `entity-record.component.ts` | W1 |
| P15-T21 | WAREHOUSE + CRM page polish pass | generic `entity-list` / `entity-record` | W1 — **Cancelled** |
| P20-T18 | W5 stock movement entity UX | `entity-record.component.*`, post movement action | W5 |

### 2.3 Web assets

| Asset | Path |
|-------|------|
| Entity fixtures mirror | `clients/web/src/assets/fixtures/metadata/{entity}.*.json` |
| i18n | `clients/web/src/assets/i18n/{en,fr,bn}.json` — entity-agnostic keys only |

### 2.4 Web wave order

```
W1-A  record-headline.util generalize (code/name/company/sku rules from metadata)
W1-B  Copy API fixtures to web assets for W1 entities
W1-C  Karma entity-system.fixture.spec.ts
W1-D  Screenshots WAREHOUSE + CRM (stack + Playwright script)
W2     JE/SALE/LEAVE fixtures + Karma parity (**P20-T13 Done** — 130/130)
W3     ACCOUNT/TERMINAL/EMPLOYEE fixtures + Karma parity (**P20-T14 Done** — 145/145)
W4     Procurement/sales fixtures (P20-T16)
W5     Stock movement grid + detail; movement_type enum labels in i18n; screenshot pack (P20-T18)
```

---

## Section 3 — Mobile + Tests

> **Owner path:** `clients/mobile/lib/`, `clients/mobile/test/`  
> **Verify (when SDK available):** `cd clients\mobile && flutter test`  
> **Local constraint:** code + unit tests only if Flutter not on PATH (`known-pitfalls.md`)

### 3.1 Generic (already works — verify)

| Capability | Path |
|------------|------|
| System section + read-only | `lib/app/entity_screen.dart` |
| Field renderers | `lib/widgets/lookup_field.dart`, `currency_field.dart`, TextareaField |
| Status chip | `lib/utils/status_chip_util.dart` |
| Datetime grid cells | `lib/utils/field_display.dart` |
| Document preview | `lib/widgets/document_preview_dialog.dart` |
| If-Match on PUT | ✅ `emcap_client.dart` + `entity_screen.dart` (P20-T11) |

### 3.2 Per-entity mobile work

| Task ID | Work | Paths | Wave |
|---------|------|-------|------|
| P14-T31 | System fields contract tests | `test/system_fields_contract_test.dart` | ✅ extend all entities |
| P20-T05-mobile | Fixture loader per entity | `test/support/entity_fixtures.dart` (**new**) | W1 ✅ |
| P15-T13 | M2 PRODUCT screenshot | `integration_test/m2_product_detail_test.dart` | W1 |
| P15-T21-mobile | Headline util parity | `lib/utils/record_headline.dart` (**new** or extend) | W1 ✅ |
| P20-T03 | M2 mobile screenshots runbook | `scripts/capture-m2-mobile-screenshots.md` | W1 |
| P20-T16-mobile | W4 fixture loader entries | `test/support/entity_fixtures.dart` | W4 |
| P20-T18-mobile | W5 stock movement screens + enum display | `lib/app/entity_screen.dart`, `field_display.dart` | W5 |

### 3.3 Cross-client test matrix (W1 deliverable)

| Entity | API pytest | Web Karma | Mobile Dart |
|--------|------------|-----------|-------------|
| PRODUCT | ✅ | ✅ | ✅ |
| WAREHOUSE | ✅ | ✅ | ☐ (test skip — fixture pending) |
| CUSTOMER | ✅ | ✅ | ✅ |
| LEAD | ✅ | ✅ | ☐ (test skip — fixture pending) |
| CONTACT | ✅ | ✅ | ☐ (test skip — fixture pending) |
| **W2** (JE, SALE, LEAVE) | ✅ | ☐ | ☐ |
| **W4** (SUPPLIER, PO, SO, INVOICE) | ✅ | ✅ | ✅ (code; local Flutter skipped) |
| **W5** (STOCK_MOVEMENT, lines) | ✅ | ✅ | ✅ (code; local Flutter skipped) |

### 3.4 Mobile wave order

```
W1-A  test/support/entity_fixtures.dart — load any API canonical JSON
W1-B  test/entity_system_contract_test.dart — parametrized like API
W1-C  record_headline.dart — metadata-driven (mirror web util)
W1-D  entity_screen.dart — send If-Match on update
W1-E  i18n keys for lookup/status if new strings added
```

---

## Backlog IDs (new)

| ID | Title | Section | Wave | Depends |
|----|-------|---------|------|---------|
| **EMCAP-P20-T05** | Metadata snapshot CI all entities | API + Tests | W1 | P14-T26 |
| **EMCAP-P20-T09** | W1 module standard fields (WAREHOUSE, CRM) | API | W1 | P20-T05 |
| **EMCAP-P20-T10** | W1 web entity fixtures + headline generalize | Web | W1 | P20-T09 |
| **EMCAP-P20-T11** | W1 mobile entity contracts + If-Match | Mobile | W1 | P20-T09 |
| **EMCAP-P20-T12** | W2 module fields (JE, SALE, LEAVE) | API | W2 | W1 |
| **EMCAP-P20-T13** | W2 web/mobile fixture parity | Web+Mobile | W2 | P20-T12 | **Done** |
| **EMCAP-P20-T14** | W3 remaining entities status + fixtures | All | W3 | W2 | **Done** |
| **EMCAP-P20-T15** | W4 procurement/sales standard profile (API) | API | W4 | W3 |
| **EMCAP-P20-T16** | W4 web/mobile fixture parity | Web+Mobile | W4 | P20-T15 |
| **EMCAP-P20-T17** | W5 STOCK_MOVEMENT + LINE entities + movement_type enum | API | W5 | M4 (P18-T03) |
| **EMCAP-P20-T18** | W5 stock movement product UX + screenshots | Web+Mobile | W5 | P20-T17 |
| **EMCAP-P20-T19** | W5 posted movement → `quantity_on_hand` hook + seed + report | API | W5 | P20-T17 |

Existing tasks still apply: **P15-T21**, **P18-T03**, **P18-T06**, **P19-T03** (field security UI).

**W5 depends on M4** (PRODUCT + WAREHOUSE Product-ready) so movement screens reuse entity UX bar from P15-T21 / P18-T03.

---

## Agent execution recipe (no re-thinking)

1. Read this file + `user-feedback-registry.md` + `codebase-index.md`.
2. Pick **one wave** (default **W1**).
3. Do **Section 1** tasks → run API verify → doc sync.
4. Do **Section 2** → run web verify → doc sync.
5. Do **Section 3** → write Dart tests (skip `flutter run` if blocked) → doc sync.
6. Update `07-product-readiness-matrix.md` rows for touched entities.
7. **No commit** until user review.

---

## Doc sync (mandatory)

| Doc | When |
|-----|------|
| `plan/03-task-backlog.md` | Task status |
| `plan/20-standard-entity-rollout.md` | Wave checkboxes |
| `spec/sdd/07-product-readiness-matrix.md` | Entity rows |
| `docs/dev/codebase-index.md` | New tests/paths |
| `docs/dev/recall-index.md` | Session memo |
| `docs/dev/HANDOFF-continue-standard-product.md` | Critical path |
