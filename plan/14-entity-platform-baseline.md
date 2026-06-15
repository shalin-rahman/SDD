# Phase 14 — Entity platform baseline (product viability)

**Status:** In progress — Slice 1 landed 2026-06-12  
**Driver:** Entity records lack standard platform attributes in metadata/UI; Phase 12/13 checklists overstated “product complete.”

**Reference entity:** `PRODUCT` (inventory module) — all slices validate against this entity first, then generalize.

**Companion:** `plan/15-entity-page-redesign.md` (presentation layer) · `spec/sdd/07-product-readiness-matrix.md`

---

## Product readiness gate (replaces pytest-only “Done”)

A capability is **Product-ready** only when:

1. **pytest / contract tests** pass for API + metadata contract
2. **UX checklist** in `plan/14-phase14-dod-checklist.md` (or Phase 15 for UI-only slices)
3. **Screenshot evidence** path recorded in matrix row (`docs/product/screenshots/…` or PR attachment)
4. Matrix row uses **Product-ready**, not **Done**, unless all three are satisfied

**Wired** = API/metadata exists, shells show raw data  
**Demo** = functional wiring, not professional UX  
**Product-ready** = ready for end-user demo without apology

Phase 12/13 backlog items remain **Wired** or **Partial** until re-verified under this gate.

---

## Slice map

| Slice | Focus | Tasks | Status |
|-------|--------|-------|--------|
| **14A-S1** | System fields + metadata injection + grid/detail display | P14-T01–T08 | **Done** (code) — screenshot pending |
| 14A-S2 | `updated_by`, version counter, soft-delete flags | P14-T10–T14 | **Done** (API); T14 UI Partial |
| 14B-S1 | Enum field type + web select | P14-T20 | **Done** |
| 14B-S2 | Lookup, currency, textarea + renderers | P14-T21–T26 | **Partial** — P14-T21–T25 Done; T26 fixtures pending |
| 14C-S1 | Status chip metadata contract | P14-T13 | **Partial** (API + web; mobile pending) |
| 14C-S2 | Mobile system fields + formatters | P14-T12, T30 | **Done** |

---

## Slice 14A-S1 — System fields (implemented)

### Tasks

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P14-T01 | Define platform system field set (`id`, `created_at`, `updated_at`, `created_by`) | — | Done |
| EMCAP-P14-T02 | Persist `created_by` on `entity_records`; reject client injection | T01 | Done |
| EMCAP-P14-T03 | Inject system section into form metadata (read-only) | T01 | Done |
| EMCAP-P14-T04 | Append system columns to grid metadata + i18n | T01 | Done |
| EMCAP-P14-T05 | Web: read-only system section, datetime formatting in grid | T03–T04 | Done |
| EMCAP-P14-T06 | pytest: metadata fixtures + `test_system_fields.py` | T02–T04 | Done |
| EMCAP-P14-T07 | Update `product.grid.keys.json` fixture | T04 | Done |
| EMCAP-P14-T08 | Matrix rows + traceability (Phase 14) | T06 | Done |

### Acceptance tests

| Test | Command / path | Expect |
|------|----------------|--------|
| System form section | `pytest platform/api/tests/test_system_fields.py::test_product_form_has_system_section` | `main` + `system` sections; fields read-only |
| System grid columns | `pytest …::test_product_grid_includes_system_columns` | Business columns + `created_at`, `updated_at`, `created_by` |
| `created_by` on create | `pytest …::test_create_record_sets_created_by_when_authenticated` | Non-null `created_by` when JWT present |
| Reject injection | `pytest …::test_reject_system_fields_in_create_payload` | 400 on `created_at` in body |
| Inventory regression | `pytest platform/api/tests/test_inventory_e2e.py` | Metadata + workflow still green |
| Web build | `npm run build` in `clients/web` | No compile errors |

### UX acceptance (PRODUCT, web)

- [ ] Grid shows **Created** / **Last updated** columns with locale-formatted datetimes
- [ ] Detail panel **System** card shows ID, timestamps, created-by (read-only)
- [ ] New record flow hides system section until saved
- [ ] Screenshot: `docs/product/screenshots/phase14-product-grid-system-columns.png`
- [ ] Screenshot: `docs/product/screenshots/phase14-product-detail-system-card.png`

### Key paths

```
platform/api/src/emcap/entity/system_fields.py
platform/api/src/emcap/metadata/builder.py
platform/api/src/emcap/persistence/repository.py
platform/api/tests/test_system_fields.py
clients/web/src/app/shared/utils/field-display.util.ts
clients/web/src/app/pages/entity/entity-list.component.*
clients/web/src/app/pages/entity/entity-record.component.*
```

---

## Slice 14A-S2 — version, soft delete (implemented)

- `updated_by` on PUT; `record_version` + `If-Match` → 409
- `deleted_at` soft delete; list excludes deleted; `POST …/restore`
- Web: PUT sends `If-Match`; restore button on deleted records
- Tests: `test_system_fields.py`, inventory e2e updated

**Next:** P14-T14 mobile restore; ~~P21-T01 PG migrations~~ Done (`002_system_columns.sql`).

---

## Slice 14B-S2 (in progress)

- **Done:** P14-T21 — `FieldType.LOOKUP` + `lookup_entity`; registry validation; PRODUCT `primary_warehouse` → WAREHOUSE
- **Done:** P14-T22 — `FieldType.CURRENCY` + `currency_code`; `FieldType.TEXTAREA`; PRODUCT `unit_price` (USD), `description`
- **Done:** P14-T23 — metadata validation module; registry startup + builder guard for LOOKUP/CURRENCY/ENUM contracts
- **Done:** P14-T24 — web lookup picker, currency input, textarea in `DynamicFormViewComponent`
- **Done:** P14-T25 — mobile `LookupField`, `CurrencyField`, `TextareaField` wired in `entity_screen.dart`
- **Done:** P14-T26 — contract fixtures per field type (API + web Karma + mobile Dart tests)

---

## Matrix row changes

See `spec/sdd/07-product-readiness-matrix.md` and updates to `03-traceability-matrix.md` Phase 14 section.
