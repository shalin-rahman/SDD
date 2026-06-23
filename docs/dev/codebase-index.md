# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

**After any code change:** run `docs/dev/recipes/sync-docs-after-change.md` (rule: `.cursor/rules/emcap-doc-sync.mdc`).

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` |
| **Standard product roadmap (API·web·mobile)** | `plan/17-standard-product-execution-playbook.md`, `plan/16-standard-product-system.md`, `plan/16-product-ready-dod.md` |
| **Standard professional app gap plan** | `plan/18-standard-professional-app-gap-plan.md` (Phase 18B — P18-T09–T22, Phases A–F) |
| **Phase 25 AP/AR/GL** | `plan/25-procurement-sales-ap-ar-accounting.md` |
| **Phase 26 business profile** | `plan/26-business-profile-configuration.md` |
| **Phase 27 i18n/l10n (BCP 47)** | `plan/26-i18n-l10n-localization.md`, `docs/dev/session-memos/2026-06-18-i18n-gap-audit.md`, `data/i18n/seed/starter-catalog.json` |
| **Phase 28 finance hardening (app review)** | `plan/28-application-review-remediation.md` — INVOICE/PRODUCT validators, JE UX, mobile parity; coverage ≥80% |
| Entity platform + UX | `plan/14-entity-platform-baseline.md`, `plan/15-entity-page-redesign.md` |
| Product readiness gate | `spec/sdd/07-product-readiness-matrix.md` |
| **All user feedback (memory)** | `docs/product/user-feedback-registry.md` (§A, §M security/memory tiers) |
| Design system + screenshots | `docs/product/design-system.md`, `docs/product/screenshots/README.md` |
| PRODUCT demo runbook | `docs/dev/product-demo-runbook.md` |
| Inventory product DoD v2 | `docs/modules/inventory-definition-of-done-v2.md` |
| Design tokens ADR | `spec/sdd/adrs/006-design-tokens-material3.md` |
| Layout designer ADR | `spec/sdd/adrs/007-layout-designer-metadata-editor.md` |
| **Doc sync checklist** | `docs/dev/recipes/sync-docs-after-change.md` |
| **Phase 12 enterprise UI** | `plan/12-enterprise-product-ui.md`, `plan/12-phase12-dod-checklist.md` |
| **Shared web components** | `clients/web/src/app/shared/README.md` |
| **Product/admin UX gap** | `spec/sdd/06-admin-product-ui-matrix.md` |
| Local stack (Windows) | `plan/11-local-dev-tooling.md`, `docs/dev/recipes/run-emcap-local-stack.md` |
| Angular web client | `plan/10-angular-cli-web.md`, ADR-005 |
| Phase 8 end-user UX | `plan/07-phase8-end-user-product.md` |
| Platform service status | `spec/sdd/04-capability-matrix.md` |
| End-user UX status | `spec/sdd/05-end-user-matrix.md` |
| Client API mapping | `plan/04-client-api-completion.md` |
| Windows local dev guide | `docs/dev/windows-local-dev.md` |
| Pitfalls / regressions | `docs/dev/known-pitfalls.md` |
| Session memos (handoffs) | `docs/dev/session-memos/`, `docs/dev/recall-index.md` |
| **New chat handoff** | `docs/dev/HANDOFF-continue-standard-product.md` (tiered read order) |
| **Architecture memory** | Registry §L/§M canonical; `session-memos/2026-06-14-conversation-architecture-memory.md` historical |
| How-to recipes | `docs/dev/recipes/` |

---

## Monorepo zones

| Zone | Key paths | When to touch |
|------|-----------|---------------|
| Platform API | `platform/api/src/emcap/` | Generic HTTP + services |
| Entity SDK | `platform/api/src/emcap/entity/models.py`, `entity/registry.py` | `FieldType` (incl. ENUM, LOOKUP, CURRENCY, TEXTAREA), `lookup_entity` / `currency_code` validation |
| Metadata display | `platform/api/src/emcap/metadata/display_schema.py`, `metadata/validation.py`, `metadata/security.py`, `entity/models.py` `StatusFieldDisplay` | Status chip contract; field-level metadata filter (P23-T01) |
| **Admin API** | `platform/api/src/emcap/admin/`, `api/routes/admin.py` | Users, roles, settings, templates, ABAC + field access overrides |
| Seed loader | `platform/api/src/emcap/seed/` | JSON seed apply/purge |
| SQL migrations | `platform/api/migrations/`, `platform/api/scripts/migrate.py` | `001_baseline.sql`, `002_system_columns.sql`; recipe `docs/dev/recipes/apply-pg-migrations.md` |
| Business modules | `modules/*/module.py` | Features **only** under `modules/`; optional `ENTITY_VALIDATORS` export |
| Inventory stock movement | `modules/inventory/stock_movement.py`, `modules/inventory/module.py` | W5 `STOCK_MOVEMENT` / `STOCK_MOVEMENT_LINE`; D1–D4 locked in `plan/20` §1.5; `apply_posted_movement()` on draft→posted |
| **Procurement AP (P25)** | `modules/procurement/purchase_order.py`, `vendor_payment.py`, `module.py` | PO line rollup; `received` spawns STOCK_MOVEMENT; VENDOR_PAYMENT multi-pay + JE draft; `deploy/security-policies.yaml` |
| **Sales AR (P25)** | `modules/sales/sales_order.py`, `customer_payment.py`, `module.py` | SO line rollup; CUSTOMER_PAYMENT partial/paid invoice status + JE draft |
| **Accounting GL (P25)** | `modules/accounting/journal.py`, `module.py` | JOURNAL_ENTRY_LINE double-entry; balanced post updates ACCOUNT.balance; void reverses |
| Entity validators hook | `platform/api/src/emcap/module/loader.py` `load_entity_validators`, `api/routes/entities.py` | Dispatches module `ENTITY_VALIDATORS` on create/update; optional `context` (repo, registry, record_id) on update for side effects |
| **Web (Angular CLI)** | `clients/web/src/app/` | Presentation — canonical |
| Web API client | `clients/web/src/app/api/emcap-client.ts` | HTTP methods |
| Web metadata | `clients/web/src/app/metadata/` | Contract + renderers; `display.status_field` status chip; W1 entity fixture specs |
| Web metadata fixtures | `clients/web/src/assets/fixtures/metadata/` | Mirror of API fixtures for Karma (W1–W5 entities with fixture specs) |
| **Web shared UI** | `clients/web/src/app/shared/` | Reusable layout, nav, grid, forms — **`shared/README.md`** |
| Web pages | `clients/web/src/app/pages/` | Thin pages; compose shared components |
| Workflow inbox | `clients/web/src/app/pages/workflow/` | P17-T01 product UX |
| Reports | `clients/web/src/app/pages/reports/` | P17-T03 catalog + run history |
| Dashboards | `clients/web/src/app/pages/dashboards/` | P17-T04 KPI card grid |
| Notifications | `clients/web/src/app/pages/notifications/` | P17-T05 notification center |
| Assistant | `clients/web/src/app/pages/assistant/` | P17-T09 thin page; composes `shared/assistant/` |
| Assistant chat UI | `clients/web/src/app/shared/assistant/` | P17-T09 `AssistantChatPanelComponent`, message bubbles |
| Document preview | `clients/web/src/app/shared/documents/` | P17-T06 side panel + `document-preview.util.ts` |
| Web shell | `clients/web/src/app/pages/shell/` | Wrapper over `AppLayoutComponent` |
| Web entity | `clients/web/src/app/pages/entity/` | **P15-T15 Done** — `entity-list` (grid) + `entity-record` (form/tabs); routes `/app/entity/:code`, `/new`, `/:recordId` |
| Web admin (Phase 12+) | `clients/web/src/app/pages/admin/` | Users, roles, **security** (ABAC + field access); master–detail for admin only |
| Web settings | `clients/web/src/app/pages/settings/` | 4-tab IA; Platform documents + Integrations branding preview (P19-T05/T06) |
| Menus API | `platform/api/src/emcap/api/routes/menus.py` | Returns `module` + optional `icon` per item (`MenuDefinition.icon`) |
| Web legacy (archive) | `clients/web-legacy/` | Read-only reference |
| Mobile | `clients/mobile/lib/` | Flutter shell; theme tokens `lib/theme/app_tokens.dart`; badges `lib/widgets/emcap_badge.dart`; **verify:** `cd clients/mobile && flutter pub get && flutter test --coverage` (80% gate: `scripts/check-flutter-coverage.py`) |
| Mobile entity | `clients/mobile/lib/app/entity_list_screen.dart`, `entity_record_screen.dart` | P15-T17 list-only grid + push record/create; bulk actions when `bulk_actions`; STOCK_MOVEMENT post/lines; P25 PO/SO lines, receive/collect, payment summary |
| `clients/mobile/lib/utils/bulk_grid_util.dart` | P18-T13 bulk selection + CSV/PDF export + org header/footer printable HTML helpers (web parity) |
| `clients/mobile/lib/utils/stock_movement_util.dart` | P18-T17 post movement + line filter helpers |
| `clients/mobile/lib/utils/purchase_order_util.dart` | P25-T09 PO receive (requires lines) + line filter + add-line gate |
| `clients/mobile/lib/utils/sales_order_util.dart` | P25-T09 SO line filter + add-line gate |
| `clients/mobile/lib/utils/payment_util.dart` | P25-T09 payment summary + AP/AR balance guards + prefill helpers |
| `clients/mobile/lib/utils/organization_profile_util.dart` | P26 org profile parse, template interpolation, logo URL guard |
| `clients/mobile/lib/utils/export_util.dart` | P26-T12 printable fields HTML + invoice print dialog helpers |
| `clients/mobile/lib/widgets/invoice_print_dialog.dart` | P26-T12 INVOICE print preview dialog with org header/footer |
| `clients/mobile/lib/app/shell.dart` | P26-T09 — passes `logoPicker: pickOrganizationLogoFromDevice` to `SettingsScreen` |
| `clients/mobile/lib/utils/organization_logo_util.dart` | P26-T09 logo validation, base64 encode, preview URL, `pickOrganizationLogoFromDevice` (`file_picker`) |
| `clients/mobile/lib/utils/record_lifecycle_util.dart` | Soft delete / restore helpers (web `record-lifecycle.util.ts` parity) |
| Mobile document preview | `clients/mobile/lib/widgets/document_preview_dialog.dart` | P17-T07 load + versions + image/text preview |
| Mobile i18n (P27) | `clients/mobile/lib/services/i18n_service.dart`, `lib/utils/locale_format_util.dart`, `assets/i18n/en-US.json`, `assets/i18n/bn-BD.json` | BCP 47 `t`/`plural` + alias migration; Intl numerals; Semantics labels on shell/entity/settings; tests `test/i18n_bundle_test.dart`, `test/locale_format_util_test.dart`, `test/i18n_keys_parity_test.dart`, `test/a11y_semantics_test.dart` |
| Web i18n (P27 W1–W2) | `clients/web/src/app/shared/services/i18n.service.ts`, `shared/utils/locale-format.util.ts`, `shared/layout/app-layout.component.*`, `assets/i18n/en-US.json`, `bn-BD.json`, `fr-FR.json` | BCP 47 bundles; legacy shims `en.json`/`bn.json` (`__localeAlias`); starter-catalog keys merged; shell a11y (skip link, landmarks); specs `i18n.service.spec.ts`, `locale-format.util.spec.ts`, `app-layout.component.spec.ts` |
| Config | `config/platform.yaml`, `config/platform-test.yaml` | Feature flags, seed |
| Seed JSON | `data/seed/core/`, `data/seed/demo/` | Core + demo data packs; W5 `stock_movements.json`; P25 `procurement.json`, `sales.json`, extended `accounting.json` (PO/SO lines, vendor/customer payments, sample JE) |
| Local scripts | `scripts/run-emcap.bat`, `scripts/lint-format.bat` | Dev workflow |
| Run logs | `logs/emcap/*.log` (`web.log`, `api.log`, `run.log`, `seed.log`) | gitignored |
| CI | `.github/workflows/ci.yml` | lint, pytest 80%, `ng build`, `ng test:ci`, `npm run test:coverage` (branch gate), Flutter 80% |
| Agent rules | `.cursor/rules/emcap-doc-sync.mdc` | **Docs mandatory with code** |

---

## Web shared component map

| Folder | Contents |
|--------|----------|
| `shared/layout/` | `AppLayoutComponent`, `MasterDetailLayoutComponent`, `PageHeaderComponent` (breadcrumbs P16-T09) |
| `shared/navigation/` | `SidenavNavComponent`, `TenantSelectComponent` |
| `shared/data/` | `DynamicDataGridComponent` |
| `shared/forms/` | `DynamicFormViewComponent` |
| `shared/entity/` | `RecordTabsComponent`, `RecordDetailHeaderComponent` |
| `shared/documents/` | `DocumentPreviewPanelComponent` |
| `shared/assistant/` | `AssistantChatPanelComponent`, `AssistantMessageBubbleComponent` |
| `shared/admin/` | `BrandingPreviewPanelComponent` (P19-T05 live preview) |
| `shared/services/` | `LayoutService`, `ShellContextService`, `ThemeService`, `I18nService` (P27: BCP 47 `en-US`/`bn-BD`/`fr-FR`, `t(key,params)`/`plural`, legacy alias migration) |
| `shared/utils/locale-format.util.ts` | P27 — `formatInteger`, `formatCurrency`, `formatDate`, `resolvePluralCategory`; spec `locale-format.util.spec.ts` |
| `shared/utils/` | export, page-title, record, tenant, **branding**, **organization-profile**, **document-preview**, **document-platform-settings**, **security-platform-settings**, **assistant-chat**, **workflow-enabled**, **field-security** helpers |
| `services/shell-nav.util.ts` | Menu filter + module grouping (app root) |

---

## Scripts (Windows)

| Script | Purpose |
|--------|---------|
| `scripts/run-emcap.bat` | Lint → tests → Docker stack → seed → web → tail logs |
| `scripts/run-emcap.bat --stack-only` | Skip lint/tests |
| `scripts/run-emcap.bat --stack-only --local` | No Docker; SQLite + uvicorn |
| `scripts/stop-emcap.bat` | `docker compose down` + free ports 8000/4200 |
| `scripts/logs-emcap.bat` | Re-follow Docker logs |
| `scripts/lint-format.bat` | ruff/black/mypy + prettier/eslint + dart format |
| `scripts/check-api-health.mjs` | Fast API health probe (8s timeout); `node scripts/check-api-health.mjs` — prefer over PowerShell `Invoke-WebRequest` without timeout (see `known-pitfalls.md`) |
| `scripts/_resolve-scripts.bat` | Resolve `scripts\` from repo root (PowerShell-safe) |
| `scripts/apply-seed.py` | Apply JSON seed to running Postgres |
| `scripts/capture-m1-screenshots.mjs` | Playwright M1 PRODUCT web screenshot pack (P15-T06 / P20-T02); requires local stack |
| `scripts/capture-p17-screenshots.mjs` | Playwright P17 platform services pack only |
| `scripts/capture-screenshot-sprint.mjs` | Combined P17-T10 + P18 M4/M5 + W5 + P19 admin screenshot sprint; `--only=admin-settings` → M6 batch (+ shell-nav + report-schedules PNGs); `--only=login-auth` → P18-T11 login/account MFA PNGs |
| `scripts/audit-i18n.mjs` | P27 — bn-BD vs en-US parity, secret scan, UTF-8, interpolation, web→mobile key parity (en-US/bn-BD/fr-FR), `settings.organization.*` bn-BD cross-surface check; CI `client-lint-web` job |
| `data/i18n/seed/starter-catalog.json` | P27 seed — `en-US`/`bn-BD` a11y, ux, security, deployment, org, plural keys |
| `spec/i18n/emcap-ui-keys.json` | Required i18n key manifest (expand in P27-T02) |
| `plan/26-i18n-l10n-localization.md` | Phase 27 i18n/l10n playbook — BCP 47, CLDR plurals, multi-agent waves |
| `plan/28-application-review-remediation.md` | Phase 28 — application review remediation (validators, JE Post/Void, mobile finance parity); FR-030 |
| `scripts/e2e-smoke.mjs` | P18-T14 Playwright smoke: login → PRODUCT CRUD + bulk delete → settings → report schedule → admin users → LEAD list; recipe `docs/dev/recipes/e2e-smoke.md` |
| `.github/workflows/e2e-smoke.yml` | Weekly + manual E2E smoke (authoritative) |
| `.github/workflows/ci.yml` | `e2e-smoke-optional` job on PRs (`continue-on-error: true`) |
| `scripts/capture-phase24-screenshots.mjs` | P24 document preview + movement lines web PNG pack (`phase24-*.png`); requires local stack |
| `scripts/capture-m2-mobile-screenshots.md` | M2 mobile screenshot runbook (P15-T13 / P20-T03); run after `flutter test --coverage` green |

**Run from repository root:** `scripts\run-emcap.bat`

---

## Test files

| File | Guards |
|------|--------|
| `platform/api/tests/test_system_fields.py` | System fields + lookup/currency/textarea metadata |
| `platform/api/tests/test_entity_system_contract.py` | P20-T05 parametrized S1–S3 for all registry entities + W1/W3 fixture key snapshots |
| `platform/api/tests/test_crm_entity_fields.py` | P20-T09 LEAD enum status, CONTACT lead lookup, status chip metadata; P18-T13 LEAD `bulk_actions` |
| `platform/api/tests/test_procurement_sales_entity_fields.py` | P20-T15 W4 + P25 balance fields on PO/INVOICE |
| `platform/api/tests/test_purchase_order_entities.py` | P25 PO lines, receive, STOCK_MOVEMENT spawn |
| `platform/api/tests/test_vendor_payment_entities.py` | P25 multi vendor payment, overpay guard, JE link |
| `platform/api/tests/test_sales_order_entities.py` | P25 SO lines, rollup, invoice chain |
| `platform/api/tests/test_customer_payment_entities.py` | P25 partial/full customer payment, invoice status |
| `platform/api/tests/test_journal_double_entry.py` | P25 balanced JE post, account balance rollup |
| `platform/api/tests/test_finance_field_security.py` | P25 finance `read_roles` + module permissions |
| `platform/api/tests/test_order_chain_entities.py` | W4 + P25 full AP/AR chain integration |
| `platform/api/tests/fixtures/metadata/{purchase_order_line,sales_order_line,vendor_payment,customer_payment,journal_entry_line}.*.json` | P25 entity metadata snapshots |
| `platform/api/tests/test_w2_entity_fields.py` | P20-T12 W2 JOURNAL_ENTRY/SALE/LEAVE_REQUEST currency/lookup/enum |
| `platform/api/tests/test_w3_entity_fields.py` | P20-T14 W3 ACCOUNT/TERMINAL/EMPLOYEE currency/enum/status + CRUD smoke |
| `platform/api/tests/test_module_report_menus.py` | P18-T05 module report menus in sidenav (`report_code`); P18-T07 menu `icon` field contract |
| `platform/api/tests/test_stock_movement_entities.py` | P20-T17–T19 W5 movement enum, line lookup chain, transfer rules, draft→posted qty_on_hand, `STOCK_MOVEMENT_HISTORY` report |
| `platform/api/tests/test_seed_loader.py` | JSON seed + demo purge; W5 `stock_movements.json`; P25 `procurement.json`/`sales.json`/`accounting.json` chain smoke |
| `platform/api/tests/fixtures/metadata/{journal_entry,sale,leave_request}.*.json` | W2 business field/column snapshots |
| `platform/api/tests/fixtures/metadata/{account,terminal,employee}.*.json` | W3 business field/column snapshots |
| `platform/api/tests/fixtures/metadata/stock_movement*.json` | W5 business field/column snapshots |
| `platform/api/tests/fixtures/metadata/{supplier,purchase_order,sales_order,invoice}.*.json` | W4 business field/column snapshots |
| `platform/api/tests/fixtures/metadata/{entity}.*.json` | W1 business field/column snapshots (PRODUCT, WAREHOUSE, CUSTOMER, LEAD, CONTACT) |
| `platform/api/tests/test_metadata_validation.py` | P14-T23 field-type metadata validation (lookup/currency/enum contracts) |
| `platform/api/tests/test_entity_registry.py` | Registry validation incl. unknown/self `lookup_entity`; `currency_code` contract |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/services/shell-nav.util.spec.ts` | Module nav filter/group + admin links |
| `clients/web/src/app/shared/services/theme.service.spec.ts` | Theme persistence |
| `clients/web/src/app/shared/layout/app-layout.component.spec.ts` | P27 W2 — skip link + landmark aria labels |
| `clients/web/src/app/shared/layout/loading-panel.component.spec.ts` | P27 W2 — loading status role + `a11y.screenReader.loading` aria-label |
| `clients/web/src/app/shared/services/i18n.service.spec.ts` | P27 W1 — BCP 47 bundles, legacy alias migration, interpolation, plural, starter-catalog keys |
| `clients/web/src/app/shared/utils/locale-format.util.spec.ts` | P27 W1 — Intl numerals/currency/date (en-US, bn-BD Bengali digits) |
| `clients/web/src/app/shared/utils/export.util.spec.ts` | CSV/PDF export + org header/footer printable HTML |
| `platform/api/tests/test_admin_api.py` | Admin users/roles/settings/templates + ABAC + security policies |
| `platform/api/tests/test_organization_profile_admin.py` | P26 GET/PUT organization profile + POST logo upload (validation, virus scan, content serve) |
| `platform/api/src/emcap/notifications/template_render.py` | P26-T13 org token interpolation + email signature merge for notification templates |
| `platform/api/tests/test_notification_template_render.py` | P26-T13 signature append/placeholder + POST `/notifications/send-template` |
| `platform/api/tests/test_admin_field_access_override.py` | P13-T10/T11 field `read_roles` override API + record/metadata enforcement |
| `clients/web/src/app/app.routes.spec.ts` | P20-T07 lazy route smoke (entity, notifications, account) |
| `clients/web/src/app/shared/data/dynamic-data-grid.component.spec.ts` | P15-T30 grid keyboard navigation |
| `platform/api/tests/test_inventory_product_smoke.py` | P18-T08 WAREHOUSE + STOCK_MOVEMENT product smoke |
| `clients/web/src/app/shared/utils/page-title.util.spec.ts` | Toolbar title resolution + i18n `labelKey` translate (M6) |
| `clients/web/src/app/shared/utils/movement-line.util.ts` | P24-T02 STOCK_MOVEMENT_LINE filter/format helpers (web + mobile parity) |
| `clients/web/src/app/shared/utils/movement-line.util.spec.ts` | Movement line filter, totals, product label map |
| `clients/web/src/app/shared/entity/child-lines-section.component.ts` | Config-driven inline child lines table (PO/SO/STOCK_MOVEMENT — P24-T02 / P25-T07) |
| `clients/web/src/app/shared/entity/child-lines-section.component.spec.ts` | Child lines empty/table/footer/error + addLine emit |
| `clients/web/src/app/shared/utils/document-preview.util.spec.ts` | Document preview mime/version helpers |
| `clients/web/src/app/shared/documents/document-preview-panel.component.spec.ts` | Document preview panel (P24-T01/T05 depth) |
| `clients/web/src/app/shared/assistant/assistant-chat-panel.component.spec.ts` | P17-T09 assistant chat panel |
| `clients/web/src/app/shared/utils/assistant-chat.util.spec.ts` | AI chat response extract helper |
| `clients/web/src/app/pages/assistant/assistant.component.spec.ts` | P17-T09 assistant page flag gate |
| `clients/web/src/app/pages/settings/rule-evaluate.component.spec.ts` | P18-T19 rule evaluate formula gate + retry |
| `clients/web/src/app/pages/settings/settings.component.spec.ts` | P19-T05/T06 settings branding preview + document platform load; P13-T21 isolation ops mocks |
| `clients/web/src/app/shared/admin/layout-editor-panel.component.ts` | P13-T31/T32 form/grid layout override editor (settings Platform tab) |
| `clients/web/src/app/shared/admin/layout-editor-panel.component.spec.ts` | Layout editor load metadata smoke |
| `clients/web/src/app/shared/utils/branding.util.spec.ts` | P19-T05 tenant branding parse, hex normalize, WCAG contrast |
| `clients/web/src/app/shared/utils/organization-profile.util.spec.ts` | P26 org profile parse, template interpolation, payload builder |
| `clients/web/src/app/shared/admin/branding-preview-panel.component.spec.ts` | P19-T05 branding preview panel + contrast warning |
| `clients/web/src/app/shared/utils/document-platform-settings.util.spec.ts` | P19-T06 parse `documents.*` from platform config |
| `clients/web/src/app/shared/utils/security-platform-settings.util.spec.ts` | P12C-T19 parse security posture from platform config |
| `clients/web/src/app/testing/a11y.util.ts` | P15-T32 axe-core Karma helper (`runA11yAudit`, component-scope rule exclusions) |
| `clients/web/src/app/pages/entity/entity-list.a11y.spec.ts` | P15-T32 entity-list axe gate |
| `clients/web/src/app/pages/settings/settings.a11y.spec.ts` | P15-T32 settings axe gate |
| `platform/api/migrations/003_tenant_layout_override.sql` | P13-T31 tenant layout override table (ADR-007) |
| `platform/api/src/emcap/metadata/layout_merge.py` | Merge tenant form/grid overrides onto SDK metadata |
| `platform/api/src/emcap/admin/layout_service.py` | Admin layout override CRUD + effective metadata |
| `platform/api/src/emcap/admin/ops_service.py` | P13-T20 tenant isolation ops write |
| `platform/api/tests/test_layout_override.py` | Layout override API: merge, tenant scope, validation, effective metadata |
| `platform/api/tests/test_layout_merge.py` | Unit tests for `layout_merge.py` form/grid merge helpers |
| `platform/api/tests/test_rbac.py` | RBAC `list_roles` / `assign_role` unit tests |
| `platform/api/tests/test_formula_engine.py` | Formula rule engine AST evaluator edge cases |
| `clients/web/karma.conf.js` | Karma coverage reporter + **80% branch / line** gate (`npm run test:coverage`; 543 specs, 80.95% branches) |
| `clients/web/src/app/metadata/contract.spec.ts` | `resolveFieldLabel` / `resolveColumnLabel` + `??` fallback contract |
| `clients/web/src/app/services/auth.service.spec.ts` | Auth token/session helpers |
| `clients/web/src/app/shared/admin/permission-picker.component.spec.ts` | Permission picker chip toggle |
| `clients/web/src/app/shared/admin/settings-toggle-group.component.spec.ts` | Settings boolean toggle group |
| `clients/web/src/app/pages/workflow/workflow.component.spec.ts` | Workflow inbox SLA/delegate/action branches |
| `clients/web/src/app/pages/reports/reports.component.spec.ts` | Report catalog + schedule label i18n |
| `clients/web/src/app/pages/dashboards/dashboards.component.spec.ts` | Dashboard KPI load/empty |
| `clients/web/src/app/pages/notifications/notifications.component.spec.ts` | Notification center list/mark-read |
| `clients/web/src/app/shared/utils/workflow-sla.util.spec.ts` | SLA level thresholds + label |
| `clients/web/src/app/shared/utils/record-lifecycle.util.spec.ts` | Soft delete / restore helpers |
| `clients/web/src/app/shared/utils/workflow-enabled.util.spec.ts` | Platform workflow feature gate |
| `clients/web/src/app/shared/entity/record-detail-header.component.spec.ts` | Record hero header actions |
| `clients/web/src/app/shared/forms/lookup-picker-dialog.component.spec.ts` | Lookup modal search/select |
| `clients/web/src/app/api/emcap-client.http.spec.ts` | EmcapClient fetch mock surface + SSE stream |
| `clients/web/src/app/guards/guards.spec.ts` | `authGuard`, `adminGuard`, `settingsGuard` |
| `clients/web/src/app/services/emcap-api.service.spec.ts` | API service token injection + HTTP errors |
| `clients/web/src/app/shared/services/shell-context.service.spec.ts` | Shell context load + tenant select + nav load error/empty (M6) |
| `clients/web/src/app/metadata/dynamic-grid.renderer.spec.ts` | Grid sort/filter/group/paginate |
| `clients/web/src/app/shared/utils/record-headline.util.spec.ts` | Record hero headline resolver |
| `scripts/check-flutter-coverage.py` | Flutter lcov **80%** gate (CI mobile job) |
| `clients/mobile/test/admin_widgets_test.dart` | Mobile `SettingsToggleGroup` + `PermissionPicker` widget tests |
| `clients/web/src/app/pages/account/account.component.spec.ts` | Account profile load, locale, role labels |
| `clients/web/src/app/pages/login/login.component.spec.ts` | Password + OAuth login flows |
| `clients/web/src/app/pages/entity/entity-page.util.spec.ts` | Entity menu title resolver |
| `clients/web/src/app/shared/utils/record.util.spec.ts` | Record id + input type helpers |
| `clients/web/src/app/shared/utils/tenant.util.spec.ts` | Tenant id/label + permission extractors |
| `platform/api/src/emcap/admin/report_schedule_service.py` | Admin report `schedule_cron` overrides (SettingOverrideRow) |
| `platform/api/tests/test_report_schedule_admin.py` | Report schedule admin API + document settings editable paths |
| `platform/api/tests/test_workflow_engine.py` | WorkflowEngine unit tests (transition, delegate, escalate) |
| `platform/api/tests/test_oauth_provider.py` | OAuth client-credentials provider |
| `clients/web/src/app/shared/forms/dynamic-form-view.component.spec.ts` | Dynamic form view sections + fieldChange |
| `clients/web/src/app/pages/shell/shell.component.spec.ts` | Shell page title + context load |
| `clients/mobile/test/layout_editor_panel_test.dart` | Mobile layout editor widget smoke |
| `platform/api/tests/test_admin_ops_isolation.py` | Ops isolation confirmation token + audit |
| `platform/api/tests/test_migrations.py` | P21-T01/P21-T02/P13-T31 migration SQL contract + `migrate.py` smoke |
| `docs/dev/recipes/apply-pg-migrations.md` | PostgreSQL `migrate.py up` recipe (Docker + manual); CI integration job applies before `pytest -m integration` |
| `docs/dev/recipes/tenant-isolation-write-test.md` | P19-T07 tenant write isolation runbook (unit + integration + manual steps) |
| `clients/mobile/lib/theme/app_tokens.dart` | P16-T03 `EmcapThemeTokens` ThemeExtension (ADR-006 web parity) |
| `clients/mobile/lib/widgets/emcap_badge.dart` | P16-T06 `.emcap-badge` mobile (`EmcapBadge`, `EmcapStatusChip`) |
| `clients/mobile/test/theme_tokens_test.dart` | P16-T03/P16-T06 token key + density contract |
| `clients/mobile/test/emcap_badge_test.dart` | P16-T06 badge/chip variant contract |
| `clients/mobile/test/entity_record_hero_test.dart` | P15-T13/P20-T03/P18-T09 M2 PRODUCT detail hero widget contract (6 tests) |
| `clients/mobile/test/account_screen_test.dart` | P18-T11 mobile MFA step indicator contract |
| `clients/mobile/test/entity_list_bulk_test.dart` | P18-T13 `GridMetadata.bulkActions` + `bulk_grid_util` selection/export contract (10 tests) |
| `clients/mobile/test/entity_list_screen_bulk_test.dart` | P18-T13 `EntityListScreen` bulk toolbar, delete guard, export widget tests (4) |
| `clients/mobile/test/entity_list_screen_sse_test.dart` | P18-T20 `EntityListScreen` offline/reload banner + realtime label widget tests (3) |
| `clients/mobile/test/entity_record_movement_test.dart` | P18-T17 `stock_movement_util` post/lines + soft-delete contract (9 tests) |
| `clients/mobile/test/entity_record_screen_movement_test.dart` | P18-T17 `EntityRecordScreen` post movement confirm flow widget tests (2) |
| `clients/mobile/test/purchase_order_util_test.dart` | P25-T09/T10 PO/SO/payment util contract tests (14) |
| `clients/mobile/test/entity_record_screen_po_test.dart` | P25-T09/T10 PO/SO/invoice lines, receive, payment, add-line prefill widget tests (8) |
| `clients/mobile/test/entity_record_screen_lifecycle_test.dart` | P18-T16 soft-delete restore banner on `EntityRecordScreen` widget tests (2) |
| `clients/mobile/test/lookup_field_test.dart` | P18-T16 `LookupField` + `LookupPickerDialog` widget tests (3) |
| `clients/mobile/test/document_preview_dialog_test.dart` | P18-T18 document preview dialog text/image/pdf/error widget tests (4) |
| `clients/mobile/test/crm_record_screen_test.dart` | P18-T06/T10 LEAD `EntityRecordScreen` hero smoke widget tests (2) |
| `clients/mobile/test/support/screen_metadata_fixtures.dart` | Shared form/grid JSON fixtures; P25 PO/SO/invoice/payment metadata |
| `clients/mobile/test/entity_platform_mobile_test.dart` | P18-T16 lookup/status/soft-delete mobile contracts |
| `clients/mobile/test/record_lifecycle_util_test.dart` | Soft delete / restore helpers (web parity) |
| `clients/mobile/test/a11y_semantics_test.dart` | P24-T04 — Semantics on entity list/record/settings/admin (loading, landmarks, preview/print); manual checklist `docs/dev/recipes/mobile-a11y-manual-checklist.md` |
| `clients/mobile/test/export_util_test.dart` | P26-T12 printable fields HTML helper |
| `clients/mobile/test/entity_record_screen_invoice_print_test.dart` | P26-T12 mobile INVOICE print dialog + org header/footer |
| `clients/mobile/test/i18n_keys_parity_test.dart` | P27 web⊆mobile BCP 47 key parity (`en-US`/`bn-BD`/`fr-FR`); org BN gap gate |
| `clients/mobile/test/locale_format_util_test.dart` | P27 Bengali/Western numeral + currency + date Intl contract |
| `clients/mobile/lib/utils/locale_format_util.dart` | P27 mobile Intl format helpers (`formatInteger`, `formatCurrency`, `formatDate`, plural category) |
| `clients/mobile/lib/app/admin_security_screen.dart` | P13-T12 mobile field `read_roles` permission picker + `updateAdminFieldAccess` |
| `clients/mobile/test/admin_security_field_access_test.dart` | P13-T12 field access i18n keys + permission gate contract |
| `clients/mobile/lib/app/settings_screen.dart` | Mobile settings hub — i18n toggle groups + isolation ops + layout editor |
| `clients/mobile/lib/widgets/layout_editor_panel.dart` | P13-T31/T32 mobile layout override editor (settings) |
| `clients/web/src/app/shared/utils/workflow-state.util.spec.ts` | Workflow state label i18n |
| `clients/mobile/lib/utils/workflow_state_util.dart` | Workflow state label i18n (mobile) |
| `clients/mobile/test/workflow_state_util_test.dart` | Workflow state label contract |
| `clients/mobile/test/emcap_client_contract_test.dart` | P20-T04 full `EmcapClient` method contract (mirrors web `REQUIRED_METHODS`); M6 `setOnUnauthorized`/`clearSession` |
| `clients/mobile/test/admin_i18n_strings_test.dart` | P18-T12 admin/settings i18n key resolution (en/fr/bn) |
| `clients/mobile/test/organization_profile_util_test.dart` | P26 org profile parse, template interpolation, logo URL guard |
| `clients/mobile/test/organization_logo_util_test.dart` | P26-T09 logo file validation, base64 encode, preview URL resolution |
| `clients/mobile/test/settings_screen_organization_test.dart` | P26 org settings panel + logo upload injectable picker (5 widget tests) |
| `clients/mobile/test/login_screen_test.dart` | M6 mobile login i18n + provider chips + session-expired message |
| `clients/mobile/test/mobile_sse_grid_test.dart` | P15-T14/P18-T20 SSE grid realtime + `GridMetadata` flags (7 tests) |
| `clients/mobile/test/crm_entity_contract_test.dart` | P18-T06/P18-T10 LEAD/CONTACT fixture + hero/grid contract tests |
| `clients/web/src/app/pages/admin/admin-users.component.spec.ts` | P18-T21 load retry, saveError, deactivate confirm; P19-T02 CRUD smoke |
| `clients/web/src/app/pages/admin/admin-roles.component.spec.ts` | P18-T21 load retry; P19-T02 admin roles smoke; P16-T09 breadcrumb spec |
| `clients/web/src/app/pages/admin/admin-security.component.spec.ts` | P18-T21 ABAC empty/retry + field matrix; P19-T03/T04; P16-T09 breadcrumb spec |
| `clients/web/src/app/pages/admin/admin-permissions.component.spec.ts` | P18-T21 load retry; P16-T09 admin permissions breadcrumb spec |
| `clients/web/src/app/shared/navigation/sidenav-nav.component.spec.ts` | P18-T07 sidenav Material icon rendering + nav error/empty retry (M6) |
| `clients/web/src/app/shared/forms/lookup-field.component.spec.ts` | P14-T24 lookup picker |
| `clients/web/src/app/shared/forms/currency-field.component.spec.ts` | P14-T24 currency input |
| `clients/web/src/app/shared/utils/field-display.util.spec.ts` | Currency/textarea formatters |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer + currency validation |
| `clients/web/src/app/metadata/entity-system.fixture.spec.ts` | P20-T10 W1 + **W2/W3/W4/W5** entity form/grid fixture system-section + headline contract |
| `clients/web/src/app/metadata/field-types.fixture.spec.ts` | PRODUCT field-type fixture parity |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter metadata renderer parity + lookup/currency contracts |
| `clients/mobile/test/field_types_fixture_test.dart` | P14-T26 canonical `product.field-types.json` parity |
| `clients/mobile/test/support/field_types_fixture.dart` | Loads API canonical field-type + grid key fixtures |
| `clients/mobile/test/support/entity_fixtures.dart` | P20-T11/P20-T16 generic loader W1+W3+W4+W5 `{entity}.*.json` API metadata fixtures |
| `clients/mobile/test/entity_system_contract_test.dart` | P20-T11 W1+W3+W4+W5 parametrized system-section + grid keys (fixture-backed) |
| `clients/mobile/test/record_headline_test.dart` | P20-T11/P20-T18 metadata-driven record headline (W1 + W3 + W5 entities) |
| `clients/mobile/lib/utils/record_headline.dart` | P20-T11 hero headline + status chip view (web parity) |
| `clients/mobile/test/system_fields_contract_test.dart` | P14-T31 system section + datetime display contracts |
| `clients/mobile/test/field_display_test.dart` | P14-T25 currency/textarea formatters |
| `clients/mobile/test/lookup_display_test.dart` | P14-T25 lookup label + currency_code helpers |
| `clients/mobile/test/document_preview_util_test.dart` | P17-T07/P18-T18 mime/PDF/text/download preview util contracts (24 tests) |
| `clients/mobile/test/workflow_detail_util_test.dart` | P17-T02 workflow row actions + delegate rules |
| `clients/mobile/test/workflow_sla_util_test.dart` | P17-T02 SLA badge level thresholds |
| `clients/mobile/test/workflow_enabled_util_test.dart` | P18-T04 platform workflow gate + PRODUCT start code |
| `clients/mobile/lib/utils/document_platform_settings_util.dart` | P19-T06 parse `documents.*` from GET `/config/platform` |
| `clients/mobile/lib/utils/security_platform_settings_util.dart` | P12C-T19 parse security posture from GET `/config/platform` |
| `clients/mobile/test/document_platform_settings_util_test.dart` | P19-T06 document platform settings defaults + config parse |
| `clients/web/src/app/shared/utils/field-security.util.spec.ts` | P23-T02 secured visible field names |
| `clients/mobile/test/admin_field_access_client_test.dart` | P21-T06 mobile `updateAdminFieldAccess` contract |
| `clients/web/src/app/pages/entity/entity-list.component.spec.ts` | P15-T15 list route loads grid |
| `clients/mobile/lib/app/workflow_inbox_screen.dart` | P17-T02 filters, SLA, entity nav, detail panel |
| `clients/web/src/app/pages/entity/entity-record.component.spec.ts` | P15-T15 `/new` route opens create form |
| `clients/web/src/app/shared/entity/record-tabs.component.spec.ts` | P18-T04 workflow tab + inbox link |
| `clients/mobile/lib/utils/document_preview_util.dart` | P17-T07 mime/decode/preview view builder (web parity) |
| `clients/mobile/lib/utils/workflow_detail_util.dart` | P17-T02 labeled detail entries + action labels |
| `clients/mobile/lib/widgets/document_preview_dialog.dart` | P17-T07 document preview dialog (load, versions, image/text) |
| `clients/mobile/integration_test/m2_product_detail_test.dart` | P15-T13/P20-T03/P18-T09 M2 integration skeleton (requires local stack + device/emulator for capture) |
| `clients/mobile/lib/utils/material_icon_util.dart` | P18-T07 maps GET `/menus` icon ligatures to `IconData` |
| `clients/mobile/test/material_icon_util_test.dart` | P18-T07 icon name resolution + fallback contract |
| `clients/mobile/test/shell_nav_util_test.dart` | Module nav filter/group + admin links + `MenuItem.icon` parse |
| `clients/mobile/test/preferences_service_test.dart` | Theme/locale persistence keys |

---

## Verify commands

```powershell
cd C:\path\to\SDD
scripts\lint-format.bat
scripts\run-emcap.bat --stack-only --local
```

**Mobile only (P26 logo upload, M2 sign-off, Batch 3):**

```powershell
cd clients/mobile && flutter pub get && flutter test --coverage
python ../../scripts/check-flutter-coverage.py --lcov coverage/lcov.info --min 80
# Org logo upload subset:
flutter test test/organization_logo_util_test.dart test/settings_screen_organization_test.dart
```

Or full stack layer by layer:

```powershell
flutter --version
cd platform/api; ruff check src tests; black --check src tests; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run format:check; npm run lint; npm run build; npm run test:ci; npm run test:coverage
cd clients/mobile; flutter pub get; dart format --output=none --set-exit-if-changed .; flutter analyze; flutter test --coverage
python scripts/check-flutter-coverage.py --lcov clients/mobile/coverage/lcov.info --min 80
.\scripts\verify-full-stack.ps1
```

**Flutter SDK (local):** stable install outside Downloads — e.g. `C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin` on PATH. Pitfall: `docs/dev/known-pitfalls.md` § Flutter PATH.

**Gates:** lint-format · pytest **80%** (~91%) · Angular format+lint+build+Karma **417** specs + **80% branches** (`test:coverage`) · Flutter **80%** lines (`check-flutter-coverage.py`). Recipe: `docs/dev/recipes/add-coverage-gate.md`.
