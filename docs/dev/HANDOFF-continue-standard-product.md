# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-19 (9 web PNG sign-off — P24/P25/P26/P27 matrix 07 elevation; mobile stays Demo+ until device PNGs)

**Backlog:** P24-T01/T02 **Done (web)** · P25-T13 **Partial** (web PNG done; mobile open) · P26-T14 **Done (web)** · P27-T12 **Done (web)** · `plan/03-task-backlog.md`

**Do not commit** unless user explicitly asks.

---

## Current focus

1. **`flutter test --coverage` green (≥80%)** — full mobile suite sign-off (P20-T08); Flutter stable on PATH outside Downloads (`known-pitfalls.md` § Flutter PATH)
2. **M2 mobile PNG pack** — `scripts/capture-m2-mobile-screenshots.md`; device/emulator captures for matrix 07 mobile lanes (P25-T13 mobile, P26 org, P27 locale switch, §8–§10 entity platform)
3. **P26 Wave 2** — PDF header injection (P26-T11) after mobile verify green

**Honest gate:** web rows signed with 9 PNGs under `docs/product/screenshots/`; **do not mark mobile Product-ready** without device PNG evidence.

---

## Web PNG sign-off (2026-06-19)

| Phase | PNG(s) | Matrix 07 |
|-------|--------|-------------|
| P24-T01 | `phase24-document-preview-web.png` | §10 Document preview |
| P24-T02 | `phase24-stock-movement-lines-web.png` | §16 `STOCK_MOVEMENT_LINE` |
| P25-T13 | `phase25-purchase-order-detail-web.png`, `phase25-vendor-payment-detail-web.png`, `phase25-sales-order-detail-web.png`, `phase25-invoice-partial-web.png`, `phase25-journal-entry-detail-web.png` | §18 (5 rows) |
| P26-T14 | `phase26-organization-profile-web.png` | §19 Organization profile |
| P27-T12 | `phase27-locale-switch-bn-bd-web.png` | §20 i18n / locale switcher |

Capture: `node scripts/capture-phase24-screenshots.mjs` · `node scripts/capture-signoff-screenshots.mjs --only=p25|p26|p27`

---

## Sprint 10 (2026-06-18) — P24 web (no Flutter)

| Task | Deliverable |
|------|-------------|
| **P24-T02** | `movement-line.util.ts` + `child-lines-section` shared grid (PO/SO/STOCK_MOVEMENT parity); capture script uses `.child-lines__table` |
| **P24-T05** | entity-record + movement-line + document-preview + `child-lines-section.component.spec.ts`; **492/492**; branches **80.15%** |
| **P24-T01** | **Done (web)** — `phase24-document-preview-web.png`; panel spec depth + PDF preview view test |
| **P24-T03/T04** | Pending — Flutter/mobile admin + a11y |

---

## Sprint 9 (2026-06-18) — Batch 2 screen/widget tests

Plan: `docs/dev/session-memos/2026-06-18-partials-completion-plan.md`

| File | Tests | Covers |
|------|-------|--------|
| `entity_list_screen_bulk_test.dart` | 4 | Bulk toolbar, delete guard, export |
| `entity_list_screen_sse_test.dart` | 3 | Offline/reload banner, realtime label |
| `document_preview_dialog_test.dart` | 4 | Dialog text/image/pdf/error modes |
| `lookup_field_test.dart` | 3 | Lookup picker stub + clear |
| `entity_record_screen_lifecycle_test.dart` | 2 | Soft-delete restore banner |
| `entity_record_screen_movement_test.dart` | 2 | Post movement confirm flow |
| `crm_record_screen_test.dart` | 2 | LEAD hero smoke on `EntityRecordScreen` |
| `test/support/screen_metadata_fixtures.dart` | — | Shared form/grid JSON for screen tests |

---

## Still Partial (mobile gates)

| Remaining gate | Tasks |
|----------------|-------|
| **Mobile PNG evidence** | P15-T13, P20-T03, P18-T06/T09/T10/T16/T17/T18/T20, P25-T13 mobile, P26 org logo, P27 locale switch — run `scripts/capture-m2-mobile-screenshots.md`; do **not** mark Product-ready without PNGs |
| **`flutter test --coverage` verify** | P18-T13 + Batch 3 screen tests — `cd clients/mobile && flutter pub get && flutter test --coverage` |
| **Matrix ongoing** | P20-T08 (M2/M3 mobile Product-ready sign-off after verify + PNG) |

---

## Verify

```bat
cd clients\web && npm run build && npm run test:ci
cd clients\web && npm run test:coverage
cd platform\api && python -m pytest tests/test_entity_system_contract.py tests/test_inventory_product_smoke.py tests/test_migrations.py tests/test_module_report_menus.py -q
cd platform\api && python -m pytest --cov=emcap --cov-fail-under=80 -q
flutter --version
cd clients/mobile && flutter pub get && flutter test --coverage
node scripts/e2e-smoke.mjs
node scripts/audit-i18n.mjs
node scripts/capture-phase24-screenshots.mjs
node scripts/capture-signoff-screenshots.mjs --only=p25
```

**Last verify (Sprint 13 / P25-T11/T12):** `pytest tests/test_seed_loader.py` **9/9**; Karma **527/527**; branches gate green on `npm run test:ci`.

---

## Suggested prompt (new chat)

> Continue EMCAP from HANDOFF. **Web PNG sign-off Done** (9 PNGs, matrix 07 §10/§16/§18/§19/§20). Next: **`flutter test --coverage` green (≥80%)** + **M2 mobile PNG pack**. Mobile stays Demo+ until device PNGs. No commit before review.

---

## Phase 25 status (2026-06-19)

| Wave | Tasks | Status |
|------|-------|--------|
| W1–W2 Backend + Security | P25-T01–T06 | **Done** — finance pytest green |
| W3 Web | P25-T07–T08 | **Done** — child-lines-section, payment balance cards |
| W4 Mobile | P25-T09–T10 | **Done** — purchase_order/sales/payment utils |
| W5 Seed + verify | P25-T11–T12 | **Done** — demo JSON + `test_seed_loader.py` + matrices 04/05/07 |
| W6 Product-ready | P25-T13 | **Partial** — web 5 PNGs Done; mobile device PNG open |

**Backend verify (subset — functional only; use full `pytest` for 80% cov gate):**
```powershell
cd platform\api
python -m pytest -q tests/test_purchase_order_entities.py tests/test_vendor_payment_entities.py tests/test_sales_order_entities.py tests/test_customer_payment_entities.py tests/test_journal_double_entry.py tests/test_order_chain_entities.py tests/test_procurement_sales_entity_fields.py tests/test_platform_core_unchanged.py tests/test_entity_system_contract.py tests/test_finance_field_security.py
```

---

## Phase 25 verify loop (P25)

**Plan:** `C:\Users\u1074139\.cursor\plans\erp_ap_ar_phase_25_1186d93e.plan.md` section 11.

| Item | Value |
|------|-------|
| Sentinel | `AGENT_LOOP_WAKE_P25` |
| Watcher | Git `HEAD` poll every 60s (repo root); one loop per session |
| Script | `scripts/verify-phase25.ps1` (plan 11.3 full block) |
| Interim API (pre-W5 finance files) | `pytest tests/test_procurement_sales_entity_fields.py tests/test_order_chain_entities.py` (+ P25 finance files — see Phase 25 status) |
| Stop | User says stop loop — kill watcher PID |

**Loop prompt payload:** run `scripts/verify-phase25.ps1` (or interim pytest + `npm run test:coverage`); report branch %; include `flutter test --coverage` when mobile touched; update this HANDOFF when green.

**Fallback (optional):** 45m heartbeat per plan 11.2 if no git activity.
