# Phase 15 — Entity page product redesign

**Status:** In progress — Slice 1 (PRODUCT reference, web) landed 2026-06-12  
**Depends on:** Phase 14A-S1 (system fields visible in UI)

**Reference:** `PRODUCT` master–detail at professional bar; pattern generalizes to other entities.

---

## Slice 15A-S1 — PRODUCT web redesign (implemented)

### Goals

- Record hero header (SKU + name, stock/price subtitle, active chip)
- Material actions (save, delete, workflow) in header — not inline form footer
- Section cards for business fields vs system fields
- Grid polish: zebra rows, sticky header, formatted datetimes

### Tasks

| ID | Task | Status |
|----|------|--------|
| EMCAP-P15-T01 | `RecordDetailHeaderComponent` (hero + chips + actions) | Done |
| EMCAP-P15-T02 | `DynamicFormView` section cards + read-only styling | Done |
| EMCAP-P15-T03 | Entity page layout integration (PRODUCT headline logic) | Done |
| EMCAP-P15-T04 | Grid visual polish + cell formatters | Done |
| EMCAP-P15-T05 | i18n keys EN/FR/BN for new entity strings | Done |
| EMCAP-P15-T06 | UX screenshots + matrix **Product-ready** gate | Done |

### UX acceptance (PRODUCT, 1280px web)

- [x] Header shows `SKU — Name` when both present
- [x] Active/inactive chip visible on existing records
- [x] Primary actions grouped in header; form has no duplicate Save at bottom
- [x] System section visually distinct (muted card)
- [x] Grid readable at 1280px without horizontal clutter on default columns
- [x] Screenshot: `docs/product/screenshots/phase15-product-detail-hero.png`
- [x] Screenshot: `docs/product/screenshots/phase15-product-grid-polish.png`

### Key paths

```
clients/web/src/app/shared/entity/record-detail-header.component.*
clients/web/src/app/shared/forms/dynamic-form-view.component.*
clients/web/src/app/shared/data/dynamic-data-grid.component.*
clients/web/src/app/pages/entity/entity.component.*
```

---

## Slice 15A-S2 — mobile PRODUCT (implemented)

| ID | Task | Status |
|----|------|--------|
| P15-T10 | Record detail header + section cards | Done |
| P15-T11 | PRODUCT headline/subtitle util | Done |
| P15-T12 | Grid polish + datetime cells | Done |
| P15-T13 | Mobile screenshots (M2 gate) | Partial |

**Paths:** `clients/mobile/lib/app/entity_screen.dart`, `lib/utils/field_display.dart`

**Next:** Finish P15-T13 PNG capture (Flutter SDK); P15-T14 mobile SSE.

---

## Slice 15B (later)

- Entity-specific layouts from metadata (`primary_display_fields`)
- Density toggle (comfortable / compact)
- Empty-state illustration on grid zero rows
