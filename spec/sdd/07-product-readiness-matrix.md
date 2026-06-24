# EMCAP — Product readiness matrix

Honest UX depth vs `spec/framework-sdd.txt` §8–§9. Replaces pytest-only “Done” for end-user surfaces.

**Companions:** `05-end-user-matrix.md` (CRUD wiring) · `06-admin-product-ui-matrix.md` (admin shell) · `plan/14-entity-platform-baseline.md`

**Last updated:** 2026-06-24 (P29 mobile UX hardening — workflow mobile Demo+, pagination, a11y)

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
| **M1** | PRODUCT web Product-ready + screenshots | P19 admin, W4–W6 depth | **Signed (web)** — 2026-06-13; M2 mobile **Signed** 2026-06-22 |
| **M2** | PRODUCT mobile parity + screenshot | M4 inventory sign-off | **Signed (mobile)** — 2026-06-22; `phase15-mobile-product-detail.png`; **542/542** flutter; **85.71%** line coverage |
| **M3** | Entity platform (lookup, status contract, UI complete) | — | **Partial** — P18-T13 bulk Done; platform/lifecycle/movement/crm screen specs green; M2 PNG + matrix sign-off open |
| **M4** | Inventory module product (PRODUCT + WAREHOUSE) | M5 | **Signed (web)** — 2026-06-14; WAREHOUSE screenshots; mobile Demo+ |
| **M5** | Platform services UX + CRM reference | M6 | **Signed (web)** — 2026-06-17; P17-T10 screenshot pack + CRM LEAD/CONTACT PNGs + workflow state i18n (EN/FR/BN); mobile Demo+ lanes open |
| **M6** | Admin/settings product depth | — | **Signed (web)** — 2026-06-17; §12 Product-ready rows + P18-T15/T21 PNG batch (shell, report schedules, header, ABAC); mobile PNG lanes open |

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
| Soft delete + restore | Done | Demo | Demo+ | DELETE 200; web restore; mobile restore banner + `entity_record_screen_lifecycle_test.dart` (2) | Demo — mobile Product-ready blocked on M2 PNG |
| Enum field type | Done | Demo | Partial | web `<select>` | Demo |
| Lookup field type (metadata) | Done | Demo | Demo | `LookupField` + picker dialog (web + mobile) | Demo — P14-T24–T25 Done; Product-ready pending screenshots |
| Currency / textarea field types | Done | Demo | Demo | `CurrencyField` / `TextareaField`; grid currency format | Demo — P14-T24–T25 Done; Product-ready pending screenshots |
| Status chip metadata contract | Partial | Demo | Demo | `display.status_field`; web/mobile `buildStatusChipView` + `record_headline.dart` | Partial — P14-T13 API+web Done; mobile headline util P20-T11 |

---

## §9 Entity page UX (PRODUCT reference)

> **Slice 15C (Done):** Separate list/record routes on web and mobile. Screenshots below include refreshed M1 pack (list-only grid + record-only detail).

| Capability | Web | Mobile | Screenshot | Status |
|------------|-----|--------|------------|--------|
| Record hero header (SKU + name) | Done | Done | `phase15-product-detail-hero.png` · `phase15-mobile-product-detail.png` | **Product-ready** web + mobile |
| Status chip (active) | Done | Done | same pack | **Product-ready** web + mobile |
| Section cards (business / system) | Done | Done | same pack | **Product-ready** web + mobile |
| Header action bar (save/delete/workflow) | Done | Done | same pack | **Product-ready** web + mobile |
| Grid datetime formatting | Done | Done | `phase14-product-grid-system-columns.png` | **Product-ready (web)** · Mobile Demo+ |
| Grid visual polish (zebra, sticky header) | Done | Done | `phase15-product-grid-polish.png` | **Product-ready (web)** · Mobile Demo+ |
| Loading skeleton + error retry | Done | Demo | Partial | **Demo (web)** — P15-T22; mobile list load panel + error retry (`entity_list_screen`) |
| Empty grid + New CTA | Done | Demo | Partial | **Product-ready (web)** — P15-T23; mobile empty grid + `entity.new` CTA |
| Professional density at 1280px | Done | Partial | `phase15-product-detail-hero-dark.png` | **Product-ready (web)** — P16-T07 compact toggle on Account; Mobile Demo |

**Product-ready** for entity page requires all Demo rows + M1/M2 screenshot pack + `16-product-ready-dod.md` §5.

---

## §10–§15 Platform service pages

| Surface | API (04) | Product readiness | Plan |
|---------|----------|-------------------|------|
| Workflow inbox | Done | **Product-ready (web)** · mobile **Demo+** | `phase17-workflow-inbox-web.png` — empty state + CTA; **P29** mobile `BusyTextButton`, open-record deep-link, timeout error i18n, Semantics (17 a11y cases); device PNG open for Product-ready |
| Reports + history | Done | **Product-ready (web)** | `phase17-reports-history-web.png` |
| Dashboards | Done | **Product-ready (web)** | `phase17-dashboards-web.png` |
| Notifications | Done | **Product-ready (web)** | `phase17-notifications-web.png` |
| Document preview | Done | **Product-ready (web)** · mobile **Demo+** | P24-T01 `docs/product/screenshots/phase24-document-preview-web.png` — `capture-phase24-screenshots.mjs` (2026-06-19); mobile util+dialog **28/28**; device PNG open for Product-ready |
| Account / profile | Done | **Product-ready (web)** · mobile **Demo+** | `docs/product/screenshots/phase17-account-profile-web.png`; mobile MFA step indicator (`account_screen_test.dart`) |
| Assistant | Flag | **Demo+** | P18-T19 — empty/retry/i18n when `ai.enabled` |
| Rule evaluate | Done | **Demo+** | P18-T19 — formula gate + empty/retry/i18n |
| LOW_STOCK report | Done | **Product-ready (web)** | `phase18-inventory-low-stock-report.png` |
| LOW_STOCK via module nav | Done | **Product-ready (web)** | `phase18-inventory-low-stock-via-nav-web.png` — P18-T05 report menu from sidenav |

---

## §12–§13 Admin / settings (Phase 12/13 — P19 after M1)

| Area | Backlog says | Product readiness | Plan |
|------|--------------|-------------------|------|
| Enterprise shell / nav | Many Done | **Product-ready (web)** | P16-T09 + M6 i18n/retry; `phase19-shell-nav-web.png` via `capture-screenshot-sprint.mjs --only=shell-nav` |
| Admin users/roles/security | Done | **Product-ready (web)** · **Product-ready (mobile)** | P18-T15/P18-T21 web PNGs; mobile `phase24-mobile-admin-*.png` (2026-06-22) |
| Entity record header | Done | **Product-ready (web)** | P16-T05 — `RecordDetailHeaderComponent` `.emcap-badge` + `role="status"` aria-label; i18n action labels |
| Settings hub + isolation | Partial/Done | **Product-ready (web)** | `phase19-settings-ia-web.png`, `phase19-settings-isolation-web.png` — P19-T01/T07; P18-T15 |
| Layout designer (ADR-007) | Done | **Product-ready (web)** | `phase19-settings-layout-editor-web.png` — P13-T31; P18-T15 |
| Tenant branding preview | Done | **Product-ready (web)** | `phase19-settings-branding-web.png` — P19-T05; P18-T15 refresh |
| Document platform settings | Done | **Product-ready (web)** | `phase19-settings-documents-web.png` — P19-T06; Sprint 12 editable admin; P18-T15 |
| Report schedules | Done | **Product-ready (web)** | Cron editor i18n/validation; `phase19-settings-report-schedules-web.png`; `test_report_schedule_admin.py` |
| ABAC editor (P13) | Done | **Product-ready (web)** | P19-T04 + P18-T21 empty/retry/saveError; security PNG |
| Integrations (settings hub) | Done | **Product-ready (web)** | P19-T10 registry cards + REST test; Account/mobile account no dispatch buttons |
| Mobile TalkBack/VoiceOver semantics | P24-T04 + P29-T08 Done | **Demo+** | `test/a11y_semantics_test.dart` (17 cases incl. workflow inbox); manual device checklist `docs/dev/recipes/mobile-a11y-manual-checklist.md` |

---

## §16 Inventory — stock movements (W5)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| `STOCK_MOVEMENT` entity + `movement_type` enum | Done | Product-ready | Demo | `phase20-stock-movement-grid-web.png`, `phase20-stock-movement-detail-web.png` | **Product-ready (web)** |
| `STOCK_MOVEMENT_LINE` child rows | Done | **Product-ready (web)** | Demo+ | P24-T02 `docs/product/screenshots/phase24-stock-movement-lines-web.png` — `capture-phase24-screenshots.mjs` (2026-06-19); inline grid with product labels, unit cost, line total, add-line CTA | **Product-ready (web)** · Mobile Demo+ (device PNG open) |
| Movement types: receive, return, bonus, gift, damage, lost, transfer, adjustment, issue | Done | Product-ready | Demo | `modules/inventory/module.py` | **Product-ready (web)** |
| Transfer single-doc model + source warehouse validation | Done | Demo | Demo | `modules/inventory/stock_movement.py` | Demo |
| Posted movement updates `quantity_on_hand` | Done | Demo | Demo | `apply_posted_movement()` · P20-T19 | Demo |
| Stock movement UX + screenshots | Done | Product-ready | Demo+ | **P20-T18** + P18-T17 util (9) + movement screen (2) | **Product-ready (web)** · Mobile Demo+ (M2 PNG pending) |

---

## §17 Reference modules (M4 / M5)

> **Slice 15C:** WAREHOUSE / LEAD / CONTACT / STOCK_MOVEMENT screenshots use **separate list + record routes** (grid-only list PNG, record-only detail PNG). Refreshed 2026-06-14 via `node scripts/capture-screenshot-sprint.mjs --only=entity-packs`.

| Entity | Web | Mobile | Screenshot | Status |
|--------|-----|--------|------------|--------|
| WAREHOUSE grid + detail | Done | Demo | `phase18-warehouse-grid-web.png`, `phase18-warehouse-detail-web.png` | **Product-ready (web)** |
| LEAD grid + detail | Done | Demo | `phase18-crm-lead-grid-web.png`, `phase18-crm-lead-detail-web.png` | **Product-ready (web)** · Mobile Demo+ (P18-T10 screen specs green; M2 PNG pending) |
| CONTACT grid + detail | Done | Demo | `phase18-crm-contact-grid-web.png`, `phase18-crm-contact-detail-web.png` | **Product-ready (web)** · Mobile Demo+ (P18-T10 contracts) |

**Related (P18-T04 Done):** `STOCK_ADJUSTMENT` workflow on PRODUCT detail — web + mobile submit/approve path; approval UX only; does not replace movement document (W5).

---

## §18 Procurement / Sales / AP-AR / GL (P25)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| `PURCHASE_ORDER` + `PURCHASE_ORDER_LINE` child rows | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase25-purchase-order-detail-web.png` · `phase25-purchase-order-detail-mobile.png` | **Product-ready** both surfaces |
| PO receive → `STOCK_MOVEMENT` spawn | Done | Demo | Demo | `modules/procurement/purchase_order.py`; `test_purchase_order_entities.py` | Demo |
| `VENDOR_PAYMENT` multi-pay + PO balance | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase25-vendor-payment-detail-*.png` | **Product-ready** both surfaces |
| `SALES_ORDER` + `SALES_ORDER_LINE` child rows | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase25-sales-order-detail-*.png` | **Product-ready** both surfaces |
| `INVOICE` partial/paid + `CUSTOMER_PAYMENT` multi-pay | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase25-invoice-partial-*.png` | **Product-ready** both surfaces |
| `JOURNAL_ENTRY` + `JOURNAL_ENTRY_LINE` double-entry | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase25-journal-entry-detail-*.png`; P28 JE Post/Void UX | **Product-ready** both surfaces |
| Finance field security (`accounting.view`) | Done | Demo | Demo | P25-T06 `test_finance_field_security.py` | Demo |
| Demo seed loader smoke | Done | N/A | N/A | `test_seed_loader.py` — procurement/sales/GL chain (9 passed) | Done |

**Product-ready (web)** for P25 rows: P25-T13 screenshot pack sign-off refresh 2026-06-19 — 5 PNGs via `capture-signoff-screenshots.mjs --only=p25` + `16-product-ready-dod.md` §5 checklist:

- `docs/product/screenshots/phase25-purchase-order-detail-web.png`
- `docs/product/screenshots/phase25-vendor-payment-detail-web.png`
- `docs/product/screenshots/phase25-sales-order-detail-web.png`
- `docs/product/screenshots/phase25-invoice-partial-web.png`
- `docs/product/screenshots/phase25-journal-entry-detail-web.png`

Mobile lanes: **Product-ready** where `docs/product/screenshots/*-mobile.png` exists (8 PNGs, 2026-06-22).

---

## §19 Organization profile (P26)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| Organization profile settings panel | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase26-organization-profile-web.png` · `phase26-organization-profile-mobile.png` | **Product-ready** both surfaces |
| Logo blob upload + virus scan | Done | Demo+ | Demo+ | P26-T09 POST `/admin/organization-profile/logo`; web file picker; mobile `file_picker` via `pickOrganizationLogoFromDevice` in `shell.dart` → `SettingsScreen.logoPicker`; dart tests `organization_logo_util_test.dart` + `settings_screen_organization_test.dart` (upload via injectable picker) | Demo+ (device PNG open) |
| Favicon + secondary accent branding | Done | Demo+ | Demo+ | Web: branding panel fields + `ThemeService.applyFavicon` / `applyTenantSecondary` via `ShellContextService`; mobile branding TextFields | Demo+ |
| PDF grid export org header/footer | N/A | Demo+ | N/A | `export.util.ts` `buildPrintableTableHtml` + `entity-list` report template; karma `export.util.spec.ts` | Demo+ |
| INVOICE print view org header/footer | N/A | Demo+ | Demo+ | Web `entity-record` Print invoice + `buildPrintableFieldsHtml`; mobile `entity_record_screen` + `export_util.dart` + `invoice_print_dialog.dart`; tests `entity_record_screen_invoice_print_test.dart`, `export_util_test.dart` | **Demo+** both surfaces |
| Email signature in notification templates | Done | N/A | N/A | P26-T13 `notifications/template_render.py` org token interpolation + signature append; POST `/notifications/send-template`; pytest `test_notification_template_render.py` (6 passed) | Demo+ |

---

## §20 i18n / l10n (P27)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| BCP 47 locale bundles + locale switcher | N/A | **Product-ready (web)** | **Product-ready (mobile)** | `phase27-locale-switch-bn-bd-web.png` · `phase27-locale-switch-bn-bd-mobile.png` | **Product-ready** both surfaces |
| Locale-aware number / currency / date formatting | N/A | **Product-ready (web)** | Demo+ | `locale-format.util.ts` + karma ≥80%; mobile `locale_format_util.dart` dart tests | **Product-ready (web)** · Mobile Demo+ |
