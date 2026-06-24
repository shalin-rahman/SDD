# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-24 (matrix 07 partial closure — M3 signed; §8–§9 mobile aligned; P27 mobile PNG captured)

**Honest gate:** Web rows signed with web PNG packs; **mobile Product-ready** where device PNG exists under `docs/product/screenshots/` (**11 mobile PNGs**: M2 PRODUCT, P24 admin×3, P25 finance×5, P26 org profile, P27 locale).

---

## Flutter test session (2026-06-19–20) — learnings

**Do NOT use background multi-agents for Flutter verify** — user prefers **one file at a time** in foreground (~20–30s per file, ~15 min full suite).

| Issue | Learning |
|-------|----------|
| 50–70 min "hangs" | Background jobs interrupted mid `flutter test --coverage`; not infinite loop |
| `pumpAndSettle()` | Up to **10 min/call** on spinning loaders — use `screen_test_harness.dart` helpers |
| Missing mock | **`getPlatformConfig()`** required on any `EmcapClient` mock that opens `EntityRecordScreen` |
| Post-nav settle | **`settleEntityScreen` matches list route under pushed record** — use `pumpUntilFound(entity.newRecord)` |
| MasterDetail narrow | At width &lt;900px, selecting a template hides list pane — tap **Back** before **New template** |
| Security rate limit | `parseSecurityPlatformSettings` hardcodes **120** req/min — do not assert API mock `200` |

**Fixed this session:**
- `test/entity_list_screen_coverage_test.dart` — **7/7 pass** (~26s)
- `test/settings_screen_coverage_test.dart` — **13/13 pass** (~11s); replaced 14× `pumpAndSettle`, split logo tests, scoped module switch tap
- `test/admin_screens_test.dart` — **9/9 pass** (~4s); harness cleanup (2× `pumpAndSettle` removed)
- `test/workflow_inbox_screen_test.dart` — **4/4 pass** (~8s); harness cleanup (5× `pumpAndSettle` removed)

**Full suite (2026-06-20):** `flutter test` — **508/508 pass** (~4m); `flutter test --coverage` — **85.34%** line (4605/5396).

**Agent shell PATH:** prepend `$env:Path = "C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin;" + $env:Path` before `flutter` commands.

**Next:** Optional Demo+ elevation — org logo/favicon/branding device PNGs (matrix §19); platform-service mobile PNGs (workflow inbox, document preview). Manual capture: `flutter run -d chrome` at 390×844 or device/emulator + `integration_test/*_signoff_test.dart` / `scripts/capture-mobile-signoff-screenshots.mjs`.

Pitfalls: `docs/dev/known-pitfalls.md` § Flutter widget test (3 new entries).

---

## Current focus

Phases **24–29 Done** (2026-06-24). Backlog **0 Partial / 0 Pending**; matrix 07 stale Partials closed this session.

1. **Phase R4 deferred admin/platform depth** — permission matrix editor, dashboard charts, template editor depth, editable security policy, rule evaluate mobile, i18n residual sweep (`plan/21-standard-product-residual-gaps.md` §Phase R4)
2. **Optional Demo+ elevation** — org logo/favicon/branding device PNGs for matrix §19 rows still Demo+; platform-service mobile PNGs (workflow inbox, document preview)
3. **Maintenance** — `node scripts/audit-i18n.mjs` on any i18n touch; re-run verify block below before release

**Do not commit** unless user explicitly asks.

---

## Verify snapshot (2026-06-24 — matrix 07 closure)

| Layer | Result |
|-------|--------|
| Flutter | **542/542** pass (~3m51s); line coverage **85.71%** (5128/5983) — re-run this session |
| Web Karma | **543/543** pass; branches **80.79%**; lines **95.17%** (prior gate — unchanged this session) |
| P28 backend entity tests | **57/57** pass (prior gate) |
| P29 API pagination | `tests/test_entity_pagination.py` **3/3** pass (prior gate) |

---

## Web PNG sign-off (2026-06-19)

| Phase | PNG(s) | Matrix 07 |
|-------|--------|-------------|
| P24-T01 | `phase24-document-preview-web.png` | §10 Document preview |
| P24-T02 | `phase24-stock-movement-lines-web.png` | §16 `STOCK_MOVEMENT_LINE` |
| P25-T13 | `phase25-purchase-order-detail-web.png`, `phase25-vendor-payment-detail-web.png`, `phase25-sales-order-detail-web.png`, `phase25-invoice-partial-web.png`, `phase25-journal-entry-detail-web.png` | §18 (5 rows) |
| P26-T14 | `phase26-organization-profile-web.png` | §19 Organization profile |
| P27-T12 | `phase27-locale-switch-bn-bd-web.png`, `phase27-locale-switch-bn-bd-mobile.png` | §20 i18n / locale switcher |

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

## Optional elevation (no stale Partials)

| Remaining optional gate | Notes |
|-------------------------|-------|
| **Demo+ → Product-ready (optional)** | Matrix §19 logo/favicon/branding/email-signature rows — device PNG evidence |
| **Platform-service mobile PNGs** | Workflow inbox, document preview, account profile — widget tests green; dedicated device PNG open |
| **Phase R4 backlog** | Deferred admin/platform depth when product schedules v2 |

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

> Continue EMCAP from `docs/dev/HANDOFF-continue-standard-product.md`. Phases 24–29 **Done** — backlog **0 Partial**; matrix 07 Partials closed. **542/542** flutter **85.71%** line (re-verified 2026-06-24); **543/543** karma **80.79%** branches. Next: Phase R4 deferred items or optional Demo+ PNG elevation (§19 branding, platform-service mobile). Read `local-environment.md` for Flutter PATH. No commit before review.

---

## Phase 25 status (2026-06-19)

| Wave | Tasks | Status |
|------|-------|--------|
| W1–W2 Backend + Security | P25-T01–T06 | **Done** — finance pytest green |
| W3 Web | P25-T07–T08 | **Done** — child-lines-section, payment balance cards |
| W4 Mobile | P25-T09–T10 | **Done** — purchase_order/sales/payment utils |
| W5 Seed + verify | P25-T11–T12 | **Done** — demo JSON + `test_seed_loader.py` + matrices 04/05/07 |
| W6 Product-ready | P25-T13 | **Done** — web 5 PNGs + mobile 7 PNGs incl. `phase25-vendor-payment-detail-mobile.png` (2026-06-22); `flutter test --coverage` green |

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
