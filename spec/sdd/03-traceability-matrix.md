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
| NFR-003, NFR-004 | CI coverage gates | EMCAP-P7-T13 | `--cov-fail-under=70` CI; local ~90%; contract expanded |
| NFR-001, NFR-008, NFR-015 | Production readiness | EMCAP-P7-T15 | `docs/ops/production-readiness.md` checklist |
