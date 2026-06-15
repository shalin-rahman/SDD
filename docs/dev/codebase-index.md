# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

**After any code change:** run `docs/dev/recipes/sync-docs-after-change.md` (rule: `.cursor/rules/emcap-doc-sync.mdc`).

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` |
| **Standard product roadmap (API·web·mobile)** | `plan/17-standard-product-execution-playbook.md`, `plan/16-standard-product-system.md`, `plan/16-product-ready-dod.md` |
| **Standard entity rollout (all entities)** | `plan/20-standard-entity-rollout.md` |
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
| Mobile | `clients/mobile/lib/` | Flutter shell; theme tokens `lib/theme/app_tokens.dart`; badges `lib/widgets/emcap_badge.dart` |
| Mobile entity | `clients/mobile/lib/app/entity_list_screen.dart`, `entity_record_screen.dart` | P15-T17 list-only grid + push record/create; form visible fields from metadata only |
| Mobile document preview | `clients/mobile/lib/widgets/document_preview_dialog.dart` | P17-T07 load + versions + image/text preview |
| Config | `config/platform.yaml`, `config/platform-test.yaml` | Feature flags, seed |
| Seed JSON | `data/seed/core/`, `data/seed/demo/` | Core + demo data packs; W5 `stock_movements.json` (draft/posted movements + lines) |
| Local scripts | `scripts/run-emcap.bat`, `scripts/lint-format.bat` | Dev workflow |
| Run logs | `logs/emcap/*.log` (`web.log`, `api.log`, `run.log`, `seed.log`) | gitignored |
| CI | `.github/workflows/ci.yml` | lint, pytest, `ng build`, `ng test:ci` |
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
| `shared/services/` | `LayoutService`, `ShellContextService`, `ThemeService`, `I18nService` |
| `shared/utils/` | export, page-title, record, tenant, **branding**, **document-preview**, **document-platform-settings**, **security-platform-settings**, **assistant-chat**, **workflow-enabled**, **field-security** helpers |
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
| `scripts/_resolve-scripts.bat` | Resolve `scripts\` from repo root (PowerShell-safe) |
| `scripts/apply-seed.py` | Apply JSON seed to running Postgres |
| `scripts/capture-m1-screenshots.mjs` | Playwright M1 PRODUCT web screenshot pack (P15-T06 / P20-T02); requires local stack |
| `scripts/capture-p17-screenshots.mjs` | Playwright P17 platform services pack only |
| `scripts/capture-screenshot-sprint.mjs` | Combined P17-T10 + P18 M4/M5 + W5 + P19 admin screenshot sprint; `--only=admin-settings` for branding/doc PNGs |
| `scripts/capture-m2-mobile-screenshots.md` | M2 mobile screenshot runbook (P15-T13 / P20-T03); requires Flutter SDK |

**Run from repository root:** `scripts\run-emcap.bat`

---

## Test files

| File | Guards |
|------|--------|
| `platform/api/tests/test_system_fields.py` | System fields + lookup/currency/textarea metadata |
| `platform/api/tests/test_entity_system_contract.py` | P20-T05 parametrized S1–S3 for all registry entities + W1/W3 fixture key snapshots |
| `platform/api/tests/test_crm_entity_fields.py` | P20-T09 LEAD enum status, CONTACT lead lookup, status chip metadata |
| `platform/api/tests/test_procurement_sales_entity_fields.py` | P20-T15 W4 SUPPLIER/PO/SO/INVOICE standard profile + lookup CRUD |
| `platform/api/tests/test_w2_entity_fields.py` | P20-T12 W2 JOURNAL_ENTRY/SALE/LEAVE_REQUEST currency/lookup/enum |
| `platform/api/tests/test_w3_entity_fields.py` | P20-T14 W3 ACCOUNT/TERMINAL/EMPLOYEE currency/enum/status + CRUD smoke |
| `platform/api/tests/test_module_report_menus.py` | P18-T05 module report menus in sidenav (`report_code`); P18-T07 menu `icon` field contract |
| `platform/api/tests/test_stock_movement_entities.py` | P20-T17–T19 W5 movement enum, line lookup chain, transfer rules, draft→posted qty_on_hand, `STOCK_MOVEMENT_HISTORY` report |
| `platform/api/tests/test_seed_loader.py` | JSON seed + demo purge; W5 `stock_movements.json` smoke |
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
| `clients/web/src/app/shared/services/i18n.service.spec.ts` | Locale bundles |
| `clients/web/src/app/shared/utils/export.util.spec.ts` | CSV export |
| `platform/api/tests/test_admin_api.py` | Admin users/roles/settings/templates + ABAC + security policies |
| `platform/api/tests/test_admin_field_access_override.py` | P13-T10/T11 field `read_roles` override API + record/metadata enforcement |
| `clients/web/src/app/app.routes.spec.ts` | P20-T07 lazy route smoke (entity, notifications, account) |
| `clients/web/src/app/shared/data/dynamic-data-grid.component.spec.ts` | P15-T30 grid keyboard navigation |
| `platform/api/tests/test_inventory_product_smoke.py` | P18-T08 WAREHOUSE + STOCK_MOVEMENT product smoke |
| `clients/web/src/app/shared/utils/page-title.util.spec.ts` | Toolbar title resolution |
| `clients/web/src/app/shared/utils/document-preview.util.spec.ts` | Document preview mime/version helpers |
| `clients/web/src/app/shared/documents/document-preview-panel.component.spec.ts` | Document preview panel |
| `clients/web/src/app/shared/assistant/assistant-chat-panel.component.spec.ts` | P17-T09 assistant chat panel |
| `clients/web/src/app/shared/utils/assistant-chat.util.spec.ts` | AI chat response extract helper |
| `clients/web/src/app/pages/assistant/assistant.component.spec.ts` | P17-T09 assistant page flag gate |
| `clients/web/src/app/pages/settings/rule-evaluate.component.spec.ts` | P17-T11 rule evaluate panel |
| `clients/web/src/app/pages/settings/settings.component.spec.ts` | P19-T05/T06 settings branding preview + document platform load |
| `clients/web/src/app/shared/utils/branding.util.spec.ts` | P19-T05 tenant branding parse, hex normalize, WCAG contrast |
| `clients/web/src/app/shared/admin/branding-preview-panel.component.spec.ts` | P19-T05 branding preview panel + contrast warning |
| `clients/web/src/app/shared/utils/document-platform-settings.util.spec.ts` | P19-T06 parse `documents.*` from platform config |
| `clients/web/src/app/shared/utils/security-platform-settings.util.spec.ts` | P12C-T19 parse security posture from platform config |
| `clients/web/src/app/testing/a11y.util.ts` | P15-T32 axe-core Karma helper (`runA11yAudit`, component-scope rule exclusions) |
| `clients/web/src/app/pages/entity/entity-list.a11y.spec.ts` | P15-T32 entity-list axe gate |
| `clients/web/src/app/pages/settings/settings.a11y.spec.ts` | P15-T32 settings axe gate |
| `platform/api/tests/test_migrations.py` | P21-T01/P21-T02 migration SQL contract + `migrate.py` smoke |
| `docs/dev/recipes/apply-pg-migrations.md` | PostgreSQL `migrate.py up` recipe (Docker + manual); CI integration job applies before `pytest -m integration` |
| `docs/dev/recipes/tenant-isolation-write-test.md` | P19-T07 tenant write isolation runbook (unit + integration + manual steps) |
| `clients/mobile/lib/theme/app_tokens.dart` | P16-T03 `EmcapThemeTokens` ThemeExtension (ADR-006 web parity) |
| `clients/mobile/lib/widgets/emcap_badge.dart` | P16-T06 `.emcap-badge` mobile (`EmcapBadge`, `EmcapStatusChip`) |
| `clients/mobile/test/theme_tokens_test.dart` | P16-T03/P16-T06 token key + density contract |
| `clients/mobile/test/emcap_badge_test.dart` | P16-T06 badge/chip variant contract |
| `clients/mobile/test/entity_record_hero_test.dart` | P15-T13/P20-T03 M2 PRODUCT detail hero widget contract |
| `clients/mobile/test/emcap_client_contract_test.dart` | P20-T04 full `EmcapClient` method contract (mirrors web `REQUIRED_METHODS`) |
| `clients/mobile/test/mobile_sse_grid_test.dart` | P15-T14 SSE grid realtime + `GridMetadata.realtime`/`offline`/`grouping` contract (6 tests) |
| `clients/mobile/test/crm_entity_contract_test.dart` | P18-T06 LEAD/CONTACT fixture + hero/grid contract tests |
| `clients/web/src/app/pages/admin/admin-roles.component.spec.ts` | P19-T02 admin roles smoke (empty state + API load); P16-T09 breadcrumb spec |
| `clients/web/src/app/pages/admin/admin-security.component.spec.ts` | P19-T03 admin security field matrix; P16-T09 breadcrumb spec |
| `clients/web/src/app/pages/admin/admin-permissions.component.spec.ts` | P16-T09 admin permissions breadcrumb spec |
| `clients/web/src/app/shared/navigation/sidenav-nav.component.spec.ts` | P18-T07 sidenav Material icon rendering + fallback |
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
| `clients/mobile/test/document_preview_util_test.dart` | P17-T07 document preview mime/decode/version helpers |
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
| `clients/mobile/integration_test/m2_product_detail_test.dart` | M2 PRODUCT detail screenshot skeleton (P15-T13) |
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

Or layer by layer:

```powershell
cd platform/api; ruff check src tests; black --check src tests; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run format:check; npm run lint; npm run build; npm run test:ci
cd clients/mobile; dart format --output=none --set-exit-if-changed .; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
```

**Gates:** lint-format · pytest 80% (total ~87%) · Angular format+lint+build+Karma (20 tests) · flutter test
