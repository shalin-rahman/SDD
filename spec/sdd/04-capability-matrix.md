# EMCAP — Capability Matrix (SDD §2–§3)

Maps each SDD platform goal to **API · Web · Mobile · Infra** status.

**Legend:** Done · Partial · Stub (API/route only) · No · N/A

**Last updated:** 2026-06-12 · **Platform services wired** (Phase 9). **Product/admin UI gaps:** `spec/sdd/06-admin-product-ui-matrix.md`. **End-user CRUD:** `spec/sdd/05-end-user-matrix.md`.

---

## Functional goals (SDD §2)

| Goal | API | Web | Mobile | Infra | Notes |
|------|-----|-----|--------|-------|-------|
| Authentication | Done | Done | Done | N/A | MFA + OAuth |
| Authorization | Done | Done | Done | N/A | RBAC viewer + assign/check in Account |
| Multi-tenancy | Done | Done | Done | Done | Tenant picker + themes; Helm prod values |
| Dynamic menus | Done | Done | Done | N/A | — |
| Dynamic forms | Done | Done | Done | N/A | Validation, conditions, i18n, layout grid |
| Dynamic grids | Done | Done | Done | N/A | Sort/filter/group/export |
| Workflow | Done | Done | Done | N/A | Inbox, start, detail, escalate, rules |
| Reporting | Done | Done | Done | N/A | Run + history |
| Dashboards | Done | Done | Done | N/A | — |
| Notifications | Done | Done | Done | N/A | Multi-channel |
| Documents | Done | Done | Done | N/A | Upload + preview |
| Auditing | Done | Done | Done | N/A | — |
| Integrations | Done | Done | Done | N/A | REST, Kafka, SOAP, SFTP, GraphQL |
| Payments | Done | Done | Done | N/A | Intent + confirm (flag gated) |

---

## Platform modes (SDD §3)

| Mode | Config | API | Web / Mobile | Infra | Notes |
|------|--------|-----|--------------|-------|-------|
| Single org (`multi_tenant: false`) | Done | Done | Done | Done | — |
| SaaS (`multi_tenant: true`) | Done | Done | Done | Done | Tenant picker |
| Enterprise white-label | Done | Done | Done | Done | CSS var / `ThemeData` |

---

## Non-functional goals (SDD §2)

| NFR | API | Web / Mobile | Infra | Notes |
|-----|-----|--------------|-------|-------|
| NFR-001 Availability 99.9% | Done | N/A | Done | Helm prod + PDB |
| NFR-002 Scalability | Done | N/A | Done | HPA documented |
| NFR-003 Backend coverage ≥80% | Done | N/A | Done | CI `--cov-fail-under=80` |
| NFR-004 Client coverage ≥80% | N/A | Done | Done | Angular Karma + Flutter contract tests |
| NFR-005 OWASP | Done | Done | Done | Security middleware + SAST in CI |
| NFR-006 Observability | Done | Done | Done | Metrics + trace headers + JSON logs |
| NFR-007 Local dev Docker | Done | Done | Done | — |
| NFR-008–009 K8s / IaC | N/A | N/A | Done | Terraform + Helm + Ansible |
| NFR-010–012 CI/CD / GitFlow | Done | Done | Done | Full pipeline |
| NFR-013 Contract tests | Done | Done | Done | API + renderer tests |
| NFR-014–015 Release / DR | Done | N/A | Done | DR runbook + backup scripts |

---

## Verification sources

| Layer | Primary evidence |
|-------|------------------|
| API | `platform/api/tests/` (67+ tests, ~90% cov) |
| Web | `emcap-client.test.ts` (full route parity), renderer tests |
| Mobile | `metadata_contract_test.dart`, `emcap_client.dart` parity |
| End-user UX | `spec/sdd/05-end-user-matrix.md` |
| SDD closure | `platform/api/tests/test_sdd_completeness.py` |
| Infra | `infra/helm/`, `docs/ops/production-readiness.md` |

---

## Traceability

Requirement IDs: `spec/sdd/01-requirements.md`  
Playbooks: `plan/06-sdd-gap-closure.md`, `plan/07-phase8-end-user-product.md`, `plan/08-sdd-100-closure.md`
