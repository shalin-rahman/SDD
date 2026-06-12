# EMCAP Software Design Document — Document Control

| Field | Value |
|-------|-------|
| Document ID | EMCAP-SDD-001 |
| Title | Enterprise Multi-Tenant Core Application Platform |
| Version | 1.0 |
| Status | Approved for implementation |
| Source | `spec/framework-sdd.txt` |
| Last updated | 2026-06-12 |

## Revision history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-06-10 | Platform team | Initial SDD; Phase 0 scaffold started |
| 1.1 | 2026-06-11 | Platform team | Phase 6–7: capability matrix, gap closure playbook |
| 1.2 | 2026-06-11 | Platform team | Phase 8: end-user matrix, FR-008c, ADR-004; 131/131 backlog Done |
| 1.3 | 2026-06-11 | Platform team | Phase 10: Angular CLI web client, ADR-005; `clients/web-legacy` archived |
| 1.4 | 2026-06-12 | Platform team | Phase 11: run-emcap scripts, JSON seed, lint gates; pitfalls + 143-task backlog |
| 1.5 | 2026-06-12 | Platform team | Phase 12A: Material shell, shared UI (`clients/web/src/app/shared/`), doc-sync rule; FR-008d |

## Related documents

| Document | Path |
|----------|------|
| Requirements catalogue | `spec/sdd/01-requirements.md` |
| Architecture | `spec/sdd/02-architecture.md` |
| Traceability matrix | `spec/sdd/03-traceability-matrix.md` |
| Capability matrix | `spec/sdd/04-capability-matrix.md` |
| End-user UX matrix | `spec/sdd/05-end-user-matrix.md` |
| **Admin/product UX matrix** | `spec/sdd/06-admin-product-ui-matrix.md` |
| Phase 12 playbook | `plan/12-enterprise-product-ui.md` |
| **Doc sync recipe** | `docs/dev/recipes/sync-docs-after-change.md` |
| Shared web UI | `clients/web/src/app/shared/README.md` |
| Task backlog | `plan/03-task-backlog.md` |
| Phase 7 playbook | `plan/06-sdd-gap-closure.md` |
| Phase 8 playbook | `plan/07-phase8-end-user-product.md` |
| Phase 10 Angular web | `plan/10-angular-cli-web.md` |
| ADRs | `spec/sdd/adrs/` (incl. ADR-005 Angular CLI) |

## Scope

This SDD defines the EMCAP platform: reusable infrastructure for ERP, POS, HRM, CRM, and related enterprise systems. Business modules must not modify platform core code.

## Definitions

| Term | Meaning |
|------|---------|
| Platform core | Code under `platform/` — shared by all tenants and modules |
| Business module | Plug-in under `modules/` defined via `ModuleDefinition` |
| Metadata contract | Backend JSON schema consumed by Angular and Flutter renderers |
