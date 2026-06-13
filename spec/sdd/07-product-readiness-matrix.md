# EMCAP — Product readiness matrix

Honest UX depth vs `spec/framework-sdd.txt` §8–§9. Replaces pytest-only “Done” for end-user surfaces.

**Companions:** `05-end-user-matrix.md` (CRUD wiring) · `06-admin-product-ui-matrix.md` (admin shell) · `plan/14-entity-platform-baseline.md`

**Last updated:** 2026-06-14 (P20-T17 W5 stock movement entities — C14 API wired)

**Execution index:** `plan/17-viable-product-execution-playbook.md`  
**Roadmap:** `plan/16-standard-viable-system.md` — workstreams W1–W8, milestones M1–M6  
**DoD gate:** `plan/16-product-ready-dod.md`  
**Feedback memory:** `docs/product/user-feedback-registry.md`

---

## Milestones (summary)

| Milestone | Scope | Blocking | Status |
|-----------|--------|----------|--------|
| **M1** | PRODUCT web Product-ready + screenshots | P19 admin, W4–W6 depth | **Signed (web)** — 2026-06-13; M2 mobile open |
| **M2** | PRODUCT mobile parity + screenshot | M4 inventory sign-off | **Open** — code Demo |
| **M3** | Entity platform (lookup, status contract, UI complete) | Layout designer UI | **Partial** — 14A-S2 Done; P14-T21–T22 field-type API Done |
| **M4** | Inventory module product (PRODUCT + WAREHOUSE) | M5 | Open |
| **M5** | Platform services UX + CRM reference | M6 | Open |
| **M6** | Admin/settings product depth | — | Open |

---

## Legend

| Status | Meaning |
|--------|---------|
| **No** | Not implemented |
| **Wired** | API + thin shell; demo-quality |
| **Demo** | Functional but not shippable UX |
| **Product-ready** | pytest + UX checklist + screenshot evidence |
| **N/A** | Not an end-user surface |

Backlog **Done** ≠ **Product-ready**. Phase 12/13 backlog Done without screenshot remains **Wired** or **Demo** here.

---

## §8 Entity platform baseline

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| Business fields on entity SDK | Done | Done | Done | `modules/inventory/module.py` | Wired |
| `created_at` / `updated_at` on records | Done | Product-ready | Demo | `test_system_fields.py`; formatters | Web Product-ready · Mobile Demo |
| `created_by` on create | Done | Product-ready | Demo | `test_create_record_sets_created_by_when_authenticated` | Web Product-ready |
| System fields in form metadata | Done | Product-ready | Demo | `test_product_form_has_system_section` | Web Product-ready |
| System columns in grid metadata | Done | Product-ready | Demo | `product.grid.keys.json` | Web Product-ready |
| `updated_by` on PUT | Done | Product-ready | Demo | `test_system_fields.py`; system card screenshot | Web Product-ready |
| `record_version` + `If-Match` / 409 | Done | Product-ready | Demo | version conflict test; `emcap_client.updateRecord(ifMatch:)` | Web Product-ready · mobile If-Match wired (P20-T11) |
| Soft delete + restore | Done | Demo | Partial | DELETE 200; web restore | Demo — restore UX screenshot pending |
| Enum field type | Done | Demo | Partial | web `<select>` | Demo |
| Lookup field type (metadata) | Done | Demo | Demo | `LookupField` + picker dialog (web + mobile) | Demo — P14-T24–T25 Done; Product-ready pending screenshots |
| Currency / textarea field types | Done | Demo | Demo | `CurrencyField` / `TextareaField`; grid currency format | Demo — P14-T24–T25 Done; Product-ready pending screenshots |
| Status chip metadata contract | Partial | Demo | Demo | `display.status_field`; web/mobile `buildStatusChipView` + `record_headline.dart` | Partial — P14-T13 API+web Done; mobile headline util P20-T11 |

---

## §9 Entity page UX (PRODUCT reference)

| Capability | Web | Mobile | Screenshot | Status |
|------------|-----|--------|------------|--------|
| Record hero header (SKU + name) | Done | Done | `phase15-product-detail-hero.png` | **Product-ready (web)** · Mobile Demo |
| Status chip (active) | Done | Done | `phase15-product-detail-hero.png` | **Product-ready (web)** · Mobile Demo |
| Section cards (business / system) | Done | Done | `phase14-product-detail-system-card.png` | **Product-ready (web)** · Mobile Demo |
| Header action bar (save/delete/workflow) | Done | Done | `phase15-product-detail-hero.png` | **Product-ready (web)** · Mobile Demo |
| Grid datetime formatting | Done | Done | `phase14-product-grid-system-columns.png` | **Product-ready (web)** · Mobile Demo |
| Grid visual polish (zebra, sticky header) | Done | Done | `phase15-product-grid-polish.png` | **Product-ready (web)** · Mobile Demo |
| Loading skeleton + error retry | Done | Partial | — | Demo — P15-T22 |
| Empty grid + New CTA | Done | Partial | — | Demo — P15-T23 |
| Professional density at 1280px | Done | Partial | `phase15-product-detail-hero-dark.png` | **Product-ready (web)** · Mobile Demo |

**Product-ready** for entity page requires all Demo rows + M1/M2 screenshot pack + `16-product-ready-dod.md` §5.

---

## §10–§15 Platform service pages

| Surface | API (04) | Product readiness | Plan |
|---------|----------|-------------------|------|
| Workflow inbox | Done | **Demo** | P17-T01 web Done; P17-T02 mobile Done (code; device verify P17-T10) |
| Reports + history | Done | **Demo** | P17-T03 web Done |
| Dashboards | Done | **Demo** | P17-T04 web Done |
| Notifications | Done | **Demo** | P17-T05 web Done |
| Document preview | Done | **Demo** | P17-T06 web Done; P17-T07 mobile Done (code; device verify P17-T10) |
| Account / profile | Done | **Wired** (dev dump) | P17-T08 |
| Assistant | Flag | **Demo** | P17-T09 web Done — shared chat panel + bubbles; no `alert()` |
| Rule evaluate | Done | **Demo** | P17-T11 web Done |

---

## §12–§13 Admin / settings (Phase 12/13 — P19 after M1)

| Area | Backlog says | Product readiness | Plan |
|------|--------------|-------------------|------|
| Enterprise shell / nav | Many Done | **Demo** | P16-T09 |
| Admin users/roles | Done | **Wired** | P19-T02 |
| Settings hub | Partial/Done | **Wired** | P19-T01 |
| ABAC editor (P13) | Done | **Wired** | P19-T04 |
| Document platform settings | Pending | **No** | P19-T06, P12C-T12 |
| Integrations on Account | Done | **Wired** (wrong place) | P19-T10, P17-T08 |
| Report schedules | Done | **Demo** | P17-T03 |

Continue Phase 19 only after M1 PRODUCT web **Product-ready**.

---

## §16 Inventory — stock movements (W5)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| `STOCK_MOVEMENT` entity + `movement_type` enum | Done | No | No | `modules/inventory/module.py` · **P20-T17** · `test_stock_movement_entities.py` | **Wired** |
| `STOCK_MOVEMENT_LINE` child rows | Done | No | No | Same | **Wired** |
| Movement types: receive, return, bonus, gift, damage, lost, transfer, adjustment, issue | Done | No | No | `modules/inventory/module.py` | **Wired** |
| Transfer single-doc model + source warehouse validation | Done | No | No | `modules/inventory/stock_movement.py` · D1 locked in plan/20 | **Wired** |
| Posted movement updates `quantity_on_hand` | No | No | No | **P20-T19** — `apply_posted_movement()` in `modules/inventory/` (D2) | **No** |
| Stock movement UX + screenshots | No | No | No | **P20-T18** | **No** |

**Related (exists today):** `STOCK_ADJUSTMENT` workflow on PRODUCT — approval path only; does not replace movement document (W5).
