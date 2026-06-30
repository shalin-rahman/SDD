# EMCAP — Product readiness matrix

Honest UX depth vs `spec/framework-sdd.txt` §8–§9. Replaces pytest-only “Done” for end-user surfaces.

**Companions:** `05-end-user-matrix.md` (CRUD wiring) · `06-admin-product-ui-matrix.md` (admin shell) · `plan/14-entity-platform-baseline.md`

**Last updated:** 2026-06-29 (mobile sign-off **complete** — **75** PNGs; **33** mobile pack; §19 branding signed; M1–M6 mobile **Signed**; **Phase 30–31** scheduled — web Demo+ + R4 v2 per `plan/22`)

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
| **M3** | Entity platform (lookup, status contract, UI complete) | — | **Signed** — 2026-06-24; P18-T13 bulk Done; platform/lifecycle/movement/crm screen specs green; M2 mobile PNG signed 2026-06-22 |
| **M4** | Inventory module product (PRODUCT + WAREHOUSE) | M5 | **Signed (web)** — 2026-06-14; **Signed (mobile)** — 2026-06-25: M2 PRODUCT detail + grid pack (system columns, polish, loading, empty, error-retry, soft-delete) + WAREHOUSE + STOCK_MOVEMENT PNGs (`phase18-warehouse-*`, `phase20-stock-movement-*`, `phase24-stock-movement-lines-mobile.png`) |
| **M5** | Platform services UX + CRM reference | M6 | **Signed (web)** — 2026-06-17; **Signed (mobile)** — 2026-06-25: P17 trio (`phase17-workflow-inbox-mobile.png`, `phase24-document-preview-mobile.png`, `phase17-account-profile-mobile.png`) + CRM LEAD/CONTACT (`phase18-crm-*-mobile.png` ×4); **Deferred (R4) / N/A mobile:** reports, dashboards, notifications (no v1 route), assistant + rule evaluate (flag-gated v2), LOW_STOCK (web-only) |
| **M6** | Admin/settings product depth | — | **Signed (web + mobile admin)** — 2026-06-22; §12 Product-ready rows + P18-T15/T21 web PNG batch; mobile admin `phase24-mobile-admin-*.png` (users/roles/security) |

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
| `created_at` / `updated_at` on records | Done | Product-ready | Product-ready | `test_system_fields.py`; formatters; M2 system card in `phase15-mobile-product-detail.png` (2026-06-25) | **Product-ready** web + mobile |
| `created_by` on create | Done | Product-ready | Product-ready | `test_create_record_sets_created_by_when_authenticated`; M2 system card | **Product-ready** web + mobile |
| System fields in form metadata | Done | Product-ready | Product-ready | `test_product_form_has_system_section`; M2 system section card (2026-06-25) | **Product-ready** web + mobile |
| System columns in grid metadata | Done | Product-ready | Product-ready | `product.grid.keys.json`; `phase14-mobile-product-grid-system-columns.png` (2026-06-25) | **Product-ready** web + mobile |
| `updated_by` on PUT | Done | Product-ready | Product-ready | `test_system_fields.py`; M2 system card (2026-06-25) | **Product-ready** web + mobile |
| `record_version` + `If-Match` / 409 | Done | Product-ready | Product-ready | version conflict test; `emcap_client.updateRecord(ifMatch:)`; M2 Version field | **Product-ready** web + mobile |
| Soft delete + restore | Done | Demo | Product-ready | DELETE 200; web restore; mobile restore banner + `entity_record_screen_lifecycle_test.dart` (2); `phase14-mobile-soft-delete-restore.png` (2026-06-25) | Demo (web) · **Product-ready (mobile)** |
| Enum field type | Done | Demo | Demo | web `<select>`; mobile `DropdownButtonFormField` in `entity_record_screen.dart` | **Demo — v1 accepted** (renderers shipped; optional screenshot pack follow-up) |
| Lookup field type (metadata) | Done | Demo | Demo | `LookupField` + picker dialog (web + mobile) | **Demo — v1 accepted** (P14-T24–T25 Done; optional PNG not blocking sign-off) |
| Currency / textarea field types | Done | Demo | Demo | `CurrencyField` / `TextareaField`; grid currency format | **Demo — v1 accepted** (P14-T24–T25 Done; optional PNG not blocking sign-off) |
| Status chip metadata contract | Demo | Demo | Product-ready | `display.status_field`; web/mobile `buildStatusChipView` + `record_headline.dart`; M2 ACTIVE chip in `phase15-mobile-product-detail.png` (2026-06-25) | Demo (web) · **Product-ready (mobile)** — P14-T13 API+web Done; mobile headline util P20-T11 |

---

## §9 Entity page UX (PRODUCT reference)

> **Slice 15C (Done):** Separate list/record routes on web and mobile. Screenshots below include refreshed M1 pack (list-only grid + record-only detail).

| Capability | Web | Mobile | Screenshot | Status |
|------------|-----|--------|------------|--------|
| Record hero header (SKU + name) | Done | Done | `phase15-product-detail-hero.png` · `phase15-mobile-product-detail.png` | **Product-ready** web + mobile |
| Status chip (active) | Done | Done | same pack | **Product-ready** web + mobile |
| Section cards (business / system) | Done | Done | same pack | **Product-ready** web + mobile |
| Header action bar (save/delete/workflow) | Done | Done | same pack | **Product-ready** web + mobile |
| Grid datetime formatting | Done | Done | `phase14-product-grid-system-columns.png` · `phase14-mobile-product-grid-system-columns.png` | **Product-ready** web + mobile |
| Grid visual polish (zebra, sticky header) | Done | Done | `phase15-product-grid-polish.png` · `phase15-mobile-product-grid-polish.png` | **Product-ready** web + mobile |
| Loading skeleton + error retry | Done | Demo+ | `phase15-product-grid-loading.png` · `phase15-mobile-product-grid-loading.png` · `phase15-mobile-product-grid-error-retry.png` (2026-06-25) | **Demo+ (web)** — P15-T22; **Product-ready (mobile)** — load panel + error retry UI (`entity_list_screen_coverage_test.dart`); loading + error-retry PNGs signed |
| Empty grid + New CTA | Done | Done | `phase15-product-grid-empty.png` · `phase15-mobile-product-grid-empty.png` | **Product-ready (web)** — P15-T23; **Product-ready (mobile)** — empty grid + `entity.new` CTA (`entity_list_screen_coverage_test.dart`); device PNG 41KB (2026-06-25) |
| Professional density at 1280px | Done | Demo | Done | `phase15-product-detail-hero-dark.png` (web); `phase15-mobile-product-detail.png` (390×844, 2026-06-25) | **Product-ready (web)** — P16-T07 compact toggle on Account; **Product-ready (mobile)** — M2 detail layout |

**Product-ready** for entity page requires all Demo rows + M1/M2 screenshot pack + `16-product-ready-dod.md` §5.

---

## §10–§15 Platform service pages

| Surface | API (04) | Product readiness | Plan |
|---------|----------|-------------------|------|
| Workflow inbox | Done | **Product-ready (web)** · **Product-ready (mobile)** | `phase17-workflow-inbox-web.png` · `phase17-workflow-inbox-mobile.png` (2026-06-25); **P29** mobile `BusyTextButton`, open-record deep-link, timeout error i18n, Semantics (17 a11y cases) |
| Reports + history | Done | **Product-ready (web)** · **N/A (mobile)** | `phase17-reports-history-web.png`; **Deferred (R4)** — no v1 mobile reports route |
| Dashboards | Done | **Product-ready (web)** · **N/A (mobile)** | `phase17-dashboards-web.png`; **Deferred (R4)** — KPI cards web-only (`plan/21` §R4 charts) |
| Notifications | Done | **Product-ready (web)** · **N/A (mobile)** | `phase17-notifications-web.png`; **Deferred (R4)** — notification center web-only |
| Document preview | Done | **Product-ready (web)** · **Product-ready (mobile)** | P24-T01 `phase24-document-preview-web.png` · `phase24-document-preview-mobile.png` (2026-06-25) — `capture-phase24-screenshots.mjs` / `capture-mobile-signoff-screenshots.mjs --only=doc`; `document_preview_dialog_test.dart` (4 modes) |
| Account / profile | Done | **Product-ready (web)** · **Product-ready (mobile)** | `phase17-account-profile-web.png` · `phase17-account-profile-mobile.png` (2026-06-25); mobile MFA step indicator (`account_screen_test.dart`) |
| Assistant | Flag | **Demo+ (web)** · **Deferred (R4) / N/A (mobile)** | P18-T19 — empty/retry/i18n when `ai.enabled`; no v1 mobile assistant surface |
| Rule evaluate | Done | **Demo+ (web)** · **Deferred (R4) / N/A (mobile)** | P18-T19 — formula gate + empty/retry/i18n; mobile mirror deferred (`plan/21` §R4) |
| LOW_STOCK report | Done | **Product-ready (web)** · **N/A (mobile)** | `phase18-inventory-low-stock-report.png` — inventory report web-only |
| LOW_STOCK via module nav | Done | **Product-ready (web)** · **N/A (mobile)** | `phase18-inventory-low-stock-via-nav-web.png` — P18-T05 report menu from sidenav; no mobile nav entry |

---

## §12–§13 Admin / settings (Phase 12/13 — P19 after M1)

| Area | Backlog says | Product readiness | Plan |
|------|--------------|-------------------|------|
| Enterprise shell / nav | Many Done | **Product-ready (web)** | P16-T09 + M6 i18n/retry; `phase19-shell-nav-web.png` via `capture-screenshot-sprint.mjs --only=shell-nav` |
| Admin users/roles/security | Done | **Product-ready (web)** · **Product-ready (mobile)** | P18-T15/P18-T21 web PNGs; mobile `phase24-mobile-admin-*.png` (2026-06-22) |
| Entity record header | Done | **Product-ready (web)** | P16-T05 — `RecordDetailHeaderComponent` `.emcap-badge` + `role="status"` aria-label; i18n action labels |
| Settings hub + isolation | Done | **Product-ready (web)** | `phase19-settings-ia-web.png`, `phase19-settings-isolation-web.png` — P19-T01/T07; P18-T15 |
| Layout designer (ADR-007) | Done | **Product-ready (web)** | `phase19-settings-layout-editor-web.png` — P13-T31; P18-T15 |
| Tenant branding preview | Done | **Product-ready (web)** | `phase19-settings-branding-web.png` — P19-T05; P18-T15 refresh |
| Document platform settings | Done | **Product-ready (web)** | `phase19-settings-documents-web.png` — P19-T06; Sprint 12 editable admin; P18-T15 |
| Report schedules | Done | **Product-ready (web)** | Cron editor i18n/validation; `phase19-settings-report-schedules-web.png`; `test_report_schedule_admin.py` |
| ABAC editor (P13) | Done | **Product-ready (web)** | P19-T04 + P18-T21 empty/retry/saveError; security PNG |
| Integrations (settings hub) | Done | **Product-ready (web)** | P19-T10 registry cards + REST test; Account/mobile account no dispatch buttons |
| Mobile TalkBack/VoiceOver semantics | P24-T04 + P29-T08 Done | **Demo+** | `test/a11y_semantics_test.dart` (17 cases incl. workflow inbox); manual device checklist `docs/dev/recipes/mobile-a11y-manual-checklist.md` — **accept Demo+ for v1**; full Product-ready requires device audit (not blocking mobile sign-off) |

---

## §16 Inventory — stock movements (W5)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| `STOCK_MOVEMENT` entity + `movement_type` enum | Done | Product-ready | Product-ready | `phase20-stock-movement-grid-web.png`, `phase20-stock-movement-detail-web.png` · `phase20-stock-movement-grid-mobile.png`, `phase20-stock-movement-detail-mobile.png` (2026-06-25) | **Product-ready** web + mobile |
| `STOCK_MOVEMENT_LINE` child rows | Done | Product-ready | Product-ready | P24-T02 `phase24-stock-movement-lines-web.png` · `phase24-stock-movement-lines-mobile.png` (2026-06-25) | **Product-ready** web + mobile |
| Movement types: receive, return, bonus, gift, damage, lost, transfer, adjustment, issue | Done | Product-ready | Product-ready | `modules/inventory/module.py`; movement PNG pack (web + mobile) | **Product-ready** web + mobile |
| Transfer single-doc model + source warehouse validation | Done | Demo | Demo | `modules/inventory/stock_movement.py` | Demo |
| Posted movement updates `quantity_on_hand` | Done | Demo | Demo | `apply_posted_movement()` · P20-T19 | Demo |
| Stock movement UX + screenshots | Done | Product-ready | Product-ready | **P20-T18** + P24-T02 lines; phase20 grid/detail + phase24 lines PNG pack (web + mobile, 2026-06-25) | **Product-ready** web + mobile — evidence on rows above; no separate mobile gate |

---

## §17 Reference modules (M4 / M5)

> **Slice 15C:** WAREHOUSE / LEAD / CONTACT / STOCK_MOVEMENT screenshots use **separate list + record routes** (grid-only list PNG, record-only detail PNG). Refreshed 2026-06-14 via `node scripts/capture-screenshot-sprint.mjs --only=entity-packs`.

| Entity | Web | Mobile | Screenshot | Status |
|--------|-----|--------|------------|--------|
| WAREHOUSE grid + detail | Done | Product-ready | `phase18-warehouse-grid-web.png`, `phase18-warehouse-detail-web.png` · `phase18-warehouse-grid-mobile.png`, `phase18-warehouse-detail-mobile.png` (2026-06-25) | **Product-ready** web + mobile |
| LEAD grid + detail | Done | Product-ready | `phase18-crm-lead-grid-web.png`, `phase18-crm-lead-detail-web.png` · `phase18-crm-lead-grid-mobile.png`, `phase18-crm-lead-detail-mobile.png` (2026-06-25) | **Product-ready** web + mobile |
| CONTACT grid + detail | Done | Product-ready | `phase18-crm-contact-grid-web.png`, `phase18-crm-contact-detail-web.png` · `phase18-crm-contact-grid-mobile.png`, `phase18-crm-contact-detail-mobile.png` (2026-06-25) | **Product-ready** web + mobile |

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

Mobile lanes: **Product-ready** where device PNG exists under `docs/product/screenshots/` (**33** mobile PNGs; **75** total on disk as of 2026-06-25). Refreshed via `node scripts/capture-mobile-signoff-screenshots.mjs`. Inventory: M2 PRODUCT×7, P17 platform×3, P24 admin×3 + doc + movement lines, P25 finance×6, P26 org profile + logo, P27 locale×2, §16–§17 inventory/CRM×8, `phase19-settings-branding-mobile.png` (§19 favicon/accent).

---

## §19 Organization profile (P26)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| Organization profile settings panel | Done | **Product-ready (web)** | **Product-ready (mobile)** | `phase26-organization-profile-web.png` · `phase26-organization-profile-mobile.png` | **Product-ready** both surfaces |
| Logo blob upload + virus scan | Done | Demo+ | **Product-ready** | P26-T09 POST `/admin/organization-profile/logo`; mobile `file_picker` via `pickOrganizationLogoFromDevice` → `SettingsScreen.logoPicker`; dart tests `organization_logo_util_test.dart` + `settings_screen_organization_test.dart`; `phase26-organization-logo-mobile.png` (2026-06-25) | Demo+ (web) · **Product-ready (mobile)** |
| Favicon + secondary accent branding | Done | Demo+ | Product-ready | Web: branding panel fields + `ThemeService.applyFavicon` / `applyTenantSecondary`; mobile branding TextFields; `phase19-settings-branding-mobile.png` (2026-06-25) | Demo+ (web) · **Product-ready (mobile)** |
| PDF grid export org header/footer | N/A | Demo+ | N/A | `export.util.ts` `buildPrintableTableHtml` + `entity-list` report template; karma `export.util.spec.ts` | Demo+ |
| INVOICE print view org header/footer | N/A | Demo+ | **Product-ready** | Web `entity-record` Print invoice + `buildPrintableFieldsHtml`; mobile `entity_record_screen` + `export_util.dart` + `invoice_print_dialog.dart`; tests `entity_record_screen_invoice_print_test.dart`, `export_util_test.dart`; `phase25-invoice-print-mobile.png` (2026-06-25) | Demo+ (web) · **Product-ready (mobile)** |
| Email signature in notification templates | Done | N/A | N/A | P26-T13 `notifications/template_render.py` org token interpolation + signature append; POST `/notifications/send-template`; pytest `test_notification_template_render.py` (6 passed) | Demo+ |

---

## §20 i18n / l10n (P27)

| Capability | API | Web | Mobile | Evidence | Status |
|------------|-----|-----|--------|----------|--------|
| BCP 47 locale bundles + locale switcher | N/A | **Product-ready (web)** | **Product-ready (mobile)** | `phase27-locale-switch-bn-bd-web.png` · `phase27-locale-switch-bn-bd-mobile.png` | **Product-ready** both surfaces |
| Locale-aware number / currency / date formatting | N/A | **Product-ready (web)** | **Product-ready** | `locale-format.util.ts` + karma ≥80%; mobile `locale_format_util.dart` dart tests; `phase27-locale-format-bn-bd-mobile.png` (2026-06-25) | **Product-ready** web + mobile |

---

## Client verify snapshot (matrix 07 closure — 2026-06-25)

| Layer | Result |
|-------|--------|
| Flutter (M2/M3) | **542/542** pass (~3m51s); line **85.71%** (5128/5983) |
| Web Karma | **543/543** pass; branches **80.79%** (prior gate — unchanged this session) |
| API pagination | `tests/test_entity_pagination.py` **3/3** |
| Mobile a11y | `test/a11y_semantics_test.dart` **17** cases (incl. workflow inbox §10) |
