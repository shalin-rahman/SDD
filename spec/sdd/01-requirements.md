# EMCAP — Requirements Catalogue

Extracted from SDD v1.0 (`spec/framework-sdd.txt`). Each ID is stable for traceability.

## Functional requirements

| ID | Requirement | SDD § |
|----|-------------|-------|
| FR-001 | Platform provides authentication as a reusable service | 2, 7 |
| FR-002 | Platform provides authorization (RBAC, ABAC, row/field security) | 7 |
| FR-003 | Multi-tenancy is configurable (single-org, SaaS, white-label) | 3 |
| FR-004 | Tenant isolation strategy is configurable (shared DB, schema, DB, hybrid) | 4 |
| FR-005 | Subsystems are toggled via modular feature flags | 5 |
| FR-006 | Entity registration auto-generates APIs, forms, grids, search, audit | 8 |
| FR-007 | Dynamic forms support layout, validation, conditions, localization | 9 |
| FR-008 | Dynamic grids share one metadata contract across clients | 9 |
| FR-008a | Client shells consume platform APIs (auth, menus, metadata, CRUD, sync, reports) without direct DB access | 9 |
| FR-008b | Client shells expose all §2 reusable services (workflow actions, notifications, documents upload, audit, dashboards) — Phase 7 | 2, 9 |
| FR-008c | Client shells deliver §9 end-user UX depth (edit/delete, search, validation, conditions, i18n, grid sort/filter/group/export, auth MFA/OAuth, SaaS themes) — Phase 8 | 9 |
| FR-008d | Client shells deliver enterprise product UX: module-grouped nav, responsive master–detail, app i18n/themes, admin users/roles, platform settings hub (modules, notifications, payments, comms templates) — Phase 12 | 3, 5–7, 9, 13–16, 26, 30 |
| FR-009 | Workflow supports escalation, delegation, SLA tracking | 10 |
| FR-010 | Rule engine supports formula mode; scripting optional | 11 |
| FR-011 | Reporting: reports, dashboards, KPIs, scheduling | 12 |
| FR-012 | Notifications via configurable channels | 13 |
| FR-013 | Document storage, versioning, preview, virus scan | 14 |
| FR-014 | Integrations: REST, GraphQL, SOAP, SFTP, Kafka | 15 |
| FR-015 | Payments via configurable gateways | 16 |
| FR-016 | Optional AI capabilities behind feature flag | 17 |
| FR-017 | Immutable audit trail for CRUD, login, workflow | 19 |
| FR-018 | Business modules deploy via `ModuleDefinition` only | 26–27, 30 |
| FR-019 | SDK auto-provides menus, permissions, localization | 26 |
| FR-025 | Procurement AP: PO lines, goods receive spawns stock movement, multi vendor payment on PO | 27, 30 |
| FR-026 | Sales AR: SO lines, invoice partial/paid settlement, multi customer payment | 27, 30 |
| FR-027 | GL double-entry journal lines with account balance rollup on post | 27, 30 |
| FR-028 | Tenant organization profile: legal/contact info, document header/footer templates, in-app settings UI | 27, 30 |
| FR-029 | Client shells use BCP 47 locale tags (`en-US`, `bn-BD`, `fr-FR`), CLDR plural keys, regional numeral/date formatting, interpolation-only messages, lazy locale bundles, and a11y/compliance string catalog | 9, 27, 30 |

## Non-functional requirements

| ID | Requirement | Target | SDD § |
|----|-------------|--------|-------|
| NFR-001 | Availability | 99.9% | 2 |
| NFR-002 | Scalability | Horizontal, vertical, multi-region ready | 2 |
| NFR-003 | Backend unit test coverage | ≥80% (target 90%) | 2, 25 |
| NFR-004 | Client test coverage | ≥80% Angular, Flutter | 25 |
| NFR-005 | Security | OWASP Top 10 compliant | 2, 20 |
| NFR-006 | Observability | Structured logs, Prometheus, OpenTelemetry, Grafana | 18 |
| NFR-007 | Local dev | Docker Compose (API, PostgreSQL, Redis, MinIO) | 21 |
| NFR-008 | Production deploy | Kubernetes multi-node | 21 |
| NFR-009 | IaC | Terraform, Helm, Ansible mandatory | 22 |
| NFR-010 | CI/CD | Lint → test → security → build → deploy pipeline | 23 |
| NFR-011 | Source control | GitFlow (main, develop, release/*, hotfix/*) | 24 |
| NFR-012 | Code quality | Ruff, Black, MyPy, ESLint, Flutter Analyze | 24 |
| NFR-013 | Contract tests | Backend metadata matches Angular and Flutter | 25 |
| NFR-014 | Release versioning | MAJOR.MINOR.PATCH with migration rollback | 28 |
| NFR-015 | Disaster recovery | PITR, daily backups; RPO <15m, RTO <1h | 29 |

## Definition of done (FR-018)

A business module is complete when developers supply only:

```python
ModuleDefinition(
    entities=[],
    workflows=[],
    reports=[],
    dashboards=[],
    menus=[],
)
```

and receive platform capabilities (auth, UI, audit, DevOps, etc.) without core code changes.
