# EMCAP — Product readiness matrix

Honest UX depth vs `spec/framework-sdd.txt` §8–§9. Replaces pytest-only “Done” for end-user surfaces.

**Companions:** `05-end-user-matrix.md` (CRUD wiring) · `06-admin-product-ui-matrix.md` (admin shell) · `plan/14-entity-platform-baseline.md`

**Last updated:** 2026-06-16 (Sprint 12–13: editable document settings, report schedule admin, workflow engine tests, Karma ~59% / API 92%)

**Execution index:** `plan/17-standard-product-execution-playbook.md`
**Roadmap:** `plan/16-standard-product-system.md` — workstreams W1–W8, milestones M1–M6
**DoD gate:** `plan/16-product-ready-dod.md`  
**Feedback memory:** `docs/product/user-feedback-registry.md` (§F entity UX pivot)

---

## UX pivot notice (2026-06-14)

User feedback **C15** requires **separate list and record pages** (not single-route master–detail). Grid (list) and form (record) are **intentionally separate field sets** — C16 grid–form parity **rejected**. **P15-T15/T17 Done**; `plan/15-entity-page-redesign.md` Slice 15C.

**Impact on this matrix:** §9 entity screenshots refreshed for separate routes (M1 pack 2026-06-14).

---

## Milestones (summary)

| Milestone | Scope | Blocking | Status |
|-----------|--------|----------|--------|
| **M1** | PRODUCT web Product-ready + screenshots | P19 admin, W4–W6 depth | **Signed (web)** — 2026-06-13; M2 mobile open |
| **M2** | PRODUCT mobile parity + screenshot | M4 inventory sign-off | **Open** — code Demo+ (hero tests, tokens, menu icons, settings i18n, layout editor, field access); PNG blocked (Flutter SDK) |
| **M3** | Entity platform (lookup, status contract, UI complete) | — | **Partial** — 14A-S2 Done; field-type API Done; **ADR-007 layout editor web + mobile** (P13-T31/T32); M2 PNG still open |
| **M4** | Inventory module product (PRODUCT + WAREHOUSE) | M5 | **Signed (web)** — 2026-06-14; WAREHOUSE screenshots; mobile Demo+ |
| **M5** | Platform services UX + CRM reference | M6 | **Partial** — P17-T10 + CRM screenshots; menu icons; **workflow state i18n** (web + mobile) |
| **M6** | Admin/settings product depth | — | **Partial** — P19 Demo+ PNGs; mobile tokens, isolation ops, field access, layout editor; P15-T32 axe; P21-T03 migration CI |

---

## Session memory (2026-06-14)

Architecture, feedback, and learnings consolidated in:

- `docs/dev/session-memos/2026-06-14-conversation-architecture-memory.md`
- `docs/product/user-feedback-registry.md` §L
- `docs/dev/HANDOFF-continue-standard-product.md`

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

> **Slice 15C (Done):** Separate list/record routes on web and mobile. Screenshots below include refreshed M1 pack (list-only grid + record-only detail).

| Capability | Web | Mobile | Screenshot | Status |
|------------|-----|--------|------------|--------|
| Record hero header (SKU + name) | Done | Done | `phase15-product-detail-hero.png` | **Product-ready (web)** · Mobile Demo |
| Status chip (active) | Done | Done | `phase15-product-detail-hero.png` | **Product-ready (web)** · Mobile Demo |
| Section cards (business / system) | Done | Done | `phase14-product-detail-system-card.png` | **Product-ready (web)** · Mobile Demo |
| Header action bar (save/delete/workflow) | Done | Done | `phase15-product-detail-hero.png` | **Product-ready (web)** · Mobile Demo |
| Grid datetime formatting | Done | Done | `phase14-product-grid-system-columns.png` | **Product-ready (web)** · Mobile Demo |
| Grid visual polish (zebra, sticky header) | Done | Done | `phase15-product-grid-polish.png` | **Product-ready (web)** · Mobile Demo |
| Loading skeleton + error retry | Done | Partial | — | **Demo (web)** — P15-T22 Partial (entity load + grid reload panel); mobile pending |
| Empty grid + New CTA | Done | Partial | — | **Product-ready (web)** — P15-T23 Done (`DynamicDataGridComponent` empty + New CTA); mobile pending |
| Professional density at 1280px | Done | Partial | `phase15-product-detail-hero-dark.png` | **Product-ready (web)** — P16-T07 compact toggle on Account; Mobile Demo |

**Product-ready** for entity page requires all Demo rows + M1/M2 screenshot pack + `16-product-ready-dod.md` §5.

---

## §10–§15 Platform service pages

| Surface | API (04) | Product readiness | Plan |
|---------|----------|-------------------|------|
| Workflow inbox | Done | **Product-ready (web)** | `phase17-workflow-inbox-web.png` — empty state + CTA |
| Reports + history | Done | **Product-ready (web)** | `phase17-reports-history-web.png` |
| Dashboards | Done | **Product-ready (web)** | `phase17-dashboards-web.png` |
| Notifications | Done | **Product-ready (web)** | `phase17-notifications-web.png` |
| Document preview | Done | **Demo** | P17-T06 web Done; mobile device verify open |
| Account / profile | Done | **Product-ready (web)** | `phase17-account-profile-web.png` |
| Assistant | Flag | **Demo** | P17-T09 — not in minimum pack |
| Rule evaluate | Done | **Demo** | P17-T11 web Done — screenshot optional |
| LOW_STOCK report | Done | **Product-ready (web)** | `phase18-inventory-low-stock-report.png` |
| LOW_STOCK via module nav | Done | **Product-ready (web)** | `phase18-inventory-low-stock-via-nav-web.png` — P18-T05 report menu from sidenav |

---

## §12–§13 Admin / settings (Phase 12/13 — P19 after M1)

| Area | Backlog says | Product readiness | Plan |
|------|--------------|-------------------|------|
| Enterprise shell / nav | Many Done | **Demo** | P16-T09 breadcrumbs; P18-T07 Material menu icons (web sidenav + mobile shell `material_icon_util.dart`) |
| Admin users/roles | Done | **Demo** | `phase19-admin-users-web.png` — P19-T02; `.emcap-badge--on`/`--off` active chips |
| Entity record header | Done | **Demo** | P16-T05 — `RecordDetailHeaderComponent` `.emcap-badge` status (ADR-006) |
| Settings hub | Partial/Done | **Demo** | P19-T01 mat-tab IA; P13 layout/workflow toggles/isolation; **Sprint 12** document + report schedule edit |
| Layout designer (ADR-007) | Done | **Demo** | Web `LayoutEditorPanelComponent` + mobile `layout_editor_panel.dart`; `layout_editor_panel_test.dart` |
| Tenant branding preview | Done | **Demo** | P19-T05 — `phase19-settings-branding-web.png`; capture runbook § Sprint 13 |
| Document platform settings | Done | **Partial** | **Sprint 12** editable admin settings (was read-only cards); screenshot runbook pending refresh |
| Report schedules | Done | **Partial** | **Sprint 12** admin cron MVP in settings; `test_report_schedule_admin.py` |
| ABAC editor (P13) | Done | **Wired** | P19-T04 |
| Integrations on Account | Done | **Wired** (wrong place) | P19-T10, P17-T08 |

---

## §16 Inventory — stock movements (W5)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| `STOCK_MOVEMENT` entity + `movement_type` enum | Done | Product-ready | Demo | `phase20-stock-movement-grid-web.png`, `phase20-stock-movement-detail-web.png` | **Product-ready (web)** |
| `STOCK_MOVEMENT_LINE` child rows | Done | Demo | Demo | Same entity UX | Demo |
| Movement types: receive, return, bonus, gift, damage, lost, transfer, adjustment, issue | Done | Product-ready | Demo | `modules/inventory/module.py` | **Product-ready (web)** |
| Transfer single-doc model + source warehouse validation | Done | Demo | Demo | `modules/inventory/stock_movement.py` | Demo |
| Posted movement updates `quantity_on_hand` | Done | Demo | Demo | `apply_posted_movement()` · P20-T19 | Demo |
| Stock movement UX + screenshots | Done | Product-ready | Demo | **P20-T18** + sprint 2026-06-14 | **Product-ready (web)** |

---

## §17 Reference modules (M4 / M5)

> **Slice 15C:** WAREHOUSE / LEAD / CONTACT / STOCK_MOVEMENT screenshots use **separate list + record routes** (grid-only list PNG, record-only detail PNG). Refreshed 2026-06-14 via `node scripts/capture-screenshot-sprint.mjs --only=entity-packs`.

| Entity | Web | Mobile | Screenshot | Status |
|--------|-----|--------|------------|--------|
| WAREHOUSE grid + detail | Done | Demo | `phase18-warehouse-grid-web.png`, `phase18-warehouse-detail-web.png` | **Product-ready (web)** |
| LEAD grid + detail | Done | Demo | `phase18-crm-lead-grid-web.png`, `phase18-crm-lead-detail-web.png` | **Product-ready (web)** · Mobile Demo+ (`crm_entity_contract_test.dart`) |
| CONTACT grid + detail | Done | Demo | `phase18-crm-contact-grid-web.png`, `phase18-crm-contact-detail-web.png` | **Product-ready (web)** · Mobile Demo+ (`crm_entity_contract_test.dart`) |

**Related (P18-T04 Done):** `STOCK_ADJUSTMENT` workflow on PRODUCT detail — web + mobile submit/approve path; approval UX only; does not replace movement document (W5).
