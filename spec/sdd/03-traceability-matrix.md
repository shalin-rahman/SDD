# EMCAP — Traceability Matrix

Maps requirements → design → tasks → verification. Update when tasks complete.

## Phase 0

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| NFR-007 | `infra/docker/docker-compose.yml` | EMCAP-P0-T03 | `docker compose up` healthy |
| NFR-010 | `.github/workflows/ci.yml` | EMCAP-P0-T06, T07 | CI lint passes |
| NFR-011 | `docs/dev/gitflow.md` | EMCAP-P0-T05 | Branch policy documented |
| FR-003, FR-004, FR-005 | `config/platform.yaml`, config loader | EMCAP-P0-T02, T04 | `GET /api/v1/config/platform` |
| NFR-012 | Ruff/Black/MyPy in CI | EMCAP-P0-T06 | CI job green |

## Phase 1

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-006 | Entity registry | EMCAP-P1-T01–T05 | CUSTOMER CRUD + audit |
| FR-001, FR-002 | Auth providers, RBAC/ABAC | EMCAP-P1-T10–T15 | Auth integration tests |
| FR-003, FR-004 | Tenant middleware + strategies | EMCAP-P1-T20–T25 | Isolation test suite |
| FR-017 | Audit interceptor | EMCAP-P1-T05 | Audit log entries |
| FR-018, FR-019 | ModuleDefinition loader | EMCAP-P1-T06–T08 | Module plug-in without core edits |
| NFR-003 | Unit tests ≥80% | EMCAP-P1-T09 | Coverage report in CI |
| NFR-005 | Security middleware | EMCAP-P1-T17, T18 | OWASP test suite |

## Phase 2

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-007, FR-008 | Form/grid JSON schema | EMCAP-P2-T01–T07 | Contract tests |
| FR-009 | Workflow engine | EMCAP-P2-T09, T10 | Workflow tests |
| FR-010 | Rule engine formulas | EMCAP-P2-T11 | Rule engine tests |
| NFR-013 | Contract test harness | EMCAP-P2-T08 | CI contract job |

## Phase 3–5

| Req ID | Task IDs | Verification |
|--------|----------|--------------|
| FR-011 | EMCAP-P3-T01, T02 | Report execution test |
| FR-012 | EMCAP-P3-T03 | Notification adapter test |
| FR-013 | EMCAP-P3-T04, T05 | Document upload test |
| FR-014 | EMCAP-P3-T06 | Integration adapter test |
| FR-015 | EMCAP-P3-T07 | Payment stub test |
| FR-016 | EMCAP-P3-T08 | AI disabled by default |
| NFR-006 | EMCAP-P3-T09–T11 | Metrics/traces in Grafana |
| NFR-008, NFR-009 | EMCAP-P4-T01–T03 | UAT deploy |
| NFR-014, NFR-015 | `infra/backup/`, `docs/ops/dr-runbook.md`, `docs/ops/release-process.md`, `platform/api/scripts/migrate.py` · EMCAP-P4-T09–T11 | DR drill + `migrate.py status` |
| FR-018 (DoD) | EMCAP-P5-T01–T06 | Zero core changes sign-off |

## Phase 6 — Knowledge base + client completion

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-008a | `clients/web/`, `clients/mobile/`, `docs/dev/codebase-index.md` | EMCAP-P6-T01–T05 | Web/mobile shells; `emcap-client.test.ts` contract |
| FR-011 | `clients/web/src/app/main.ts` Reports view; `clients/mobile/lib/app/report_screen.dart` | EMCAP-P6-T03–T05 | `test_low_stock_report_filter`; manual Reports → LOW_STOCK |
| NFR-010 | `scripts/verify-full-stack.{ps1,sh}` | EMCAP-P6-T06 | Full-stack smoke script |
| NFR-012 | `docs/dev/known-pitfalls.md`, `.cursor/rules/emcap-sdd-workflow.mdc` | EMCAP-P6-T01–T02 | Agent memory; regression tests linked in pitfalls |

## Phase 7 — SDD gap closure (complete)

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-008a | Client shells full §2 parity | EMCAP-P7-T03–T12 | `spec/sdd/04-capability-matrix.md`; `emcap-client.test.ts` 33 methods |
| FR-002 | Permissions viewer in shells | EMCAP-P7-T07 | Account view; `test_auth_security.py::test_rbac_roles` |
| FR-009 | Workflow actions in shells | EMCAP-P7-T03 | Inbox actions; `test_inventory_e2e.py` workflow lifecycle |
| FR-011 | Dashboards in shells | EMCAP-P7-T08 | `test_inventory_overview_dashboard` |
| FR-012 | Notifications UI | EMCAP-P7-T05 | `test_notification_hub` |
| FR-013 | Document upload UI | EMCAP-P7-T04 | `test_document_list_by_record` |
| FR-014 | Integrations status UI | EMCAP-P7-T10 | Account integrations section; stub API routes |
| FR-015 | Payments UI (flag gated) | EMCAP-P7-T11 | Account demo when `payments.enabled`; default off |
| FR-017 | Audit viewer UI | EMCAP-P7-T06 | Record detail audit list |
| FR-003 | SaaS tenant + white-label shell | EMCAP-P7-T12 | Header tenant mode; `docs/dev/saas-shell.md` |
| NFR-003, NFR-004 | CI coverage gates | EMCAP-P7-T13 | Ratcheted to 80% in P8-T21 |
| NFR-001, NFR-008, NFR-015 | Production readiness | EMCAP-P7-T15 | `docs/ops/production-readiness.md` checklist |

## Phase 8 — End-user product depth (complete)

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-008c | Full §9 renderer + entity UX | EMCAP-P8-T03–T10 | `05-end-user-matrix.md`; web + mobile parity |
| FR-006 | Edit/delete/search/pagination | EMCAP-P8-T03–T05 | `test_crm_e2e.py`; entity screens |
| FR-007 | Validation, conditions, i18n | EMCAP-P8-T06–T07 | vitest + `metadata_contract_test.dart` |
| FR-008 | Grid sort/filter/group/export | EMCAP-P8-T08–T10 | `dynamic-grid.component.test.ts` |
| FR-001 | MFA + OAuth login UX | EMCAP-P8-T11–T12 | `test_auth_security.py`; Account + Login |
| FR-003 | SaaS tenant picker + themes | EMCAP-P8-T13 | `docs/dev/saas-shell.md` |
| FR-009 | Workflow start + SLA display | EMCAP-P8-T15 | `entity-view.ts`, `entity_screen.dart` |
| FR-011 | Report runs + schedule UI | EMCAP-P8-T16 | `listReportRuns` in report screens |
| FR-012 | Multi-channel notifications | EMCAP-P8-T17 | channel dropdown from config |
| FR-013 | Document preview/download | EMCAP-P8-T14 | `getDocument` in record detail |
| FR-014, FR-015 | Integrations dispatch + payments UX | EMCAP-P8-T18 | Account screens |
| FR-016 | AI chat UI | EMCAP-P8-T19 | Assistant nav when `ai.enabled` |
| FR-018 | CRM reference module | EMCAP-P8-T20 | `modules/crm/`, `test_crm_e2e.py` |
| NFR-003, NFR-004, NFR-013 | Renderer contract tests + 80% gate | EMCAP-P8-T21 | 60 pytest, 8 vitest, 3 flutter; CI |
| NFR-001, NFR-008, NFR-015 | Prod readiness execution | EMCAP-P8-T22 | `docs/ops/production-readiness.md` tabletop |

## Phase 11 — Local dev tooling

| Req / goal | Implementation | Task IDs | Evidence |
|------------|----------------|----------|----------|
| NFR-007 Local dev Docker | `scripts/run-emcap.bat`, compose stack | EMCAP-P11-T04 | `plan/11-local-dev-tooling.md` |
| Seed / demo data | `data/seed/`, `emcap/seed/loader.py` | EMCAP-P11-T01–T03 | `test_seed_loader.py` |
| Lint before test | `scripts/lint-format.bat`, CI format+lint | EMCAP-P11-T06–T07 | `.github/workflows/ci.yml` |
| CI workflow validity | Quoted `DATABASE_URL` in YAML | EMCAP-P11-T08 | Workflow parse / green CI |
| Dev ergonomics | `_resolve-scripts.bat`, session logs | EMCAP-P11-T05, T09 | `docs/dev/known-pitfalls.md` Phase 11 |

## Phase 12 — Enterprise product UI & admin

| Req / goal | Implementation | Task IDs | Evidence |
|------------|----------------|----------|----------|
| FR-008d Product shell | `shared/layout/app-layout`, `SidenavNavComponent`, `ShellContextService` | P12A-T01–T04, T10–T11 | `06` matrix Partial; `shell-nav.util.spec.ts` |
| FR-008d Master–detail | `MasterDetailLayoutComponent`, `DynamicDataGridComponent`, entity page | P12A-T04–T05 | `entity.component.html`; mobile `detailOpen` |
| FR-008d Page title | `page-title.util.ts` + toolbar | P12A-T09 | `page-title.util.spec.ts` |
| FR-008d i18n / themes | `ThemeService`, `I18nService`, toolbar switcher | P12A-T06–T07 | `theme.service.spec.ts`, `i18n.service.spec.ts` |
| FR-002 Admin identity | `/api/v1/admin/users|roles`, `pages/admin/*`, guards | P12B-T01–T07 | `test_admin_api.py` |
| FR-002 Row/field security viewer | `GET /admin/security/policies`, admin security screens | P12F-T40–T46 | `test_admin_security_policies` |
| FR-002 ABAC policy admin | `GET/PUT /admin/security/abac`, runtime `/auth/check` | P13-T01–T06 | `test_admin_abac_policies` |
| FR-005 Settings hub | `/api/v1/admin/settings`, `pages/settings` | P12C-T01–T04, T06 | settings + template CRUD tests |
| FR-007 App UI i18n | JSON bundles EN/FR/BN, locale switcher | P12F-T10–T12 | `i18n.service.spec.ts`, `i18n_keys_parity_test.dart` |
| FR-014 Integrations registry | `/api/v1/admin/integrations`, settings panel | P12F-T30–T36 | `test_admin_integrations_registry` |
| FR-015 Payment secrets UI | Masked GET, settings payments panel | P12F-T20–T27 | `test_admin_payment_secret_masked` |
| FR-008d Mobile rail groups | `buildRailNavSlots`, tablet rail headers | P12F-T50–T53 | `shell_nav_util_test.dart` |
| Doc sync gate | `emcap-doc-sync.mdc`, matrix rev. 6 | P12E-T01–T02 | `06-admin-product-ui-matrix.md` |
| NFR-013 Shell tests | util + service specs | P12A-T08 | 20 Karma tests CI |

## Phase 14 — Entity platform baseline

| Req / goal | Implementation | Task IDs | Evidence |
|------------|----------------|----------|----------|
| FR-006 System record fields | `entity/system_fields.py`, metadata builder injection | P14-T01–T04 | `test_system_fields.py` |
| FR-006 `created_by` persistence | `entity_records.created_by`, create route | P14-T02 | `test_create_record_sets_created_by_when_authenticated` |
| FR-007 System form section | read-only `system` section in form metadata | P14-T03, P14-T05 | `test_product_form_has_system_section` |
| FR-008 System grid columns | appended columns + i18n | P14-T04, P14-T05 | `product.grid.keys.json` |
| FR-007 Status chip contract | `display.status_field` in metadata; `StatusFieldDisplay` on entity | P14-T13 | `test_product_metadata_status_field_contract` |
| FR-006 / FR-007 Lookup field metadata | `FieldType.LOOKUP`, `lookup_entity` on `FieldDefinition`; registry cross-entity validation; form/grid JSON; save-time record ID check | P14-T21 | `test_product_lookup_field_metadata`, `test_registry_rejects_unknown_lookup_entity`, `test_create_record_rejects_unknown_lookup_reference` |
| FR-006 / FR-007 Currency + textarea metadata | `FieldType.CURRENCY` + `currency_code`; `FieldType.TEXTAREA`; form/grid JSON + coercion | P14-T22 | `test_product_currency_and_textarea_field_metadata`, `test_field_definition_currency_defaults_to_usd` |
| FR-006 / FR-007 Field-type metadata validation | `metadata/validation.py`; registry startup + builder guard for LOOKUP/CURRENCY/ENUM | P14-T23 | `test_metadata_validation.py`, `test_registry_rejects_self_lookup_entity` |
| FR-007 Web field renderers (lookup, currency, textarea) | `LookupFieldComponent`, `CurrencyFieldComponent`, textarea in `DynamicFormViewComponent` | P14-T24 | Karma: `lookup-field`, `currency-field`, `field-display.util` specs |
| FR-007 Mobile field renderers (lookup, currency, textarea) | `LookupField`, `CurrencyField`, `TextareaField` in `entity_screen.dart` | P14-T25 | `field_display_test.dart`, `lookup_display_test.dart`, `metadata_contract_test.dart` |
| Product gate | `07-product-readiness-matrix.md` | P14-T08 | Screenshot + UX checklist required for Product-ready |

## Phase 15 — Entity page redesign (PRODUCT)

| Req / goal | Implementation | Task IDs | Evidence |
|------------|----------------|----------|----------|
| FR-008d Record hero header | `record-detail-header.component` | P15-T01, P15-T03 | `07-product-readiness-matrix.md` §9 |
| FR-008d Section cards | `dynamic-form-view` Material cards | P15-T02 | Demo until screenshots |
| FR-008d Grid polish | `dynamic-data-grid` + `field-display.util` | P15-T04 | Demo until screenshots |
