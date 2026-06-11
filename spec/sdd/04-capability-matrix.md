# EMCAP — Capability Matrix (SDD §2–§3)

Maps each SDD platform goal to **API · Web · Mobile · Infra** status.

**Legend:** Done · Partial · Stub (API/route only) · No · N/A

**Last updated:** 2026-06-11 · Phase 7 targets close all Partial/No rows.

---

## Functional goals (SDD §2)

| Goal | API | Web | Mobile | Infra | Phase 7 task |
|------|-----|-----|--------|-------|--------------|
| Authentication | Done | Done | Done | N/A | — |
| Authorization | Done | Done | Done | N/A | P7-T07 |
| Multi-tenancy | Done | Partial | Partial | Partial | P7-T12 |
| Dynamic menus | Done | Done | Done | N/A | — |
| Dynamic forms | Done | Done | Done | N/A | — |
| Dynamic grids | Done | Done | Partial | N/A | P7-T09 |
| Workflow | Done | Done | Done | N/A | P7-T03 |
| Reporting | Done | Done | Done | N/A | — |
| Dashboards | Done | Done | Done | N/A | P7-T08 |
| Notifications | Done | Done | Done | N/A | P7-T05 |
| Documents | Done | Done | Done | N/A | P7-T04 |
| Auditing | Done | Done | Done | N/A | P7-T06 |
| Integrations | Stub | Partial | Partial | N/A | P7-T10 |
| Payments | Stub | Partial | Partial | N/A | P7-T11 |

### Notes

- **Partial (multi-tenancy):** tenant mode shown in header/Account; no admin tenant switcher or per-tenant theme tokens yet (`docs/dev/saas-shell.md`).
- **Partial (grids, mobile):** web exports CSV when `grid.export.csv`; mobile optional export not wired.
- **Partial (integrations/payments):** API routes are stubs; Account screen lists integration endpoints and payments demo when `payments.enabled` in config (default off).

---

## Platform modes (SDD §3)

| Mode | Config | API | Web / Mobile | Infra | Phase 7 task |
|------|--------|-----|--------------|-------|--------------|
| Single org (`multi_tenant: false`) | Done | Done | Done | Done (dev) | — |
| SaaS (`multi_tenant: true`) | Done | Done | Partial | Partial (prod Helm) | P7-T12 |
| Enterprise white-label | Done | Partial | Partial | Partial (prod values) | P7-T12 |

---

## Non-functional goals (SDD §2)

| NFR | API | Web / Mobile | Infra | Phase 7 task |
|-----|-----|--------------|-------|--------------|
| NFR-001 Availability 99.9% | Partial | N/A | Partial | P7-T15 |
| NFR-002 Scalability | Partial | N/A | Partial | P7-T15 |
| NFR-003 Backend coverage ≥80% | Done | N/A | Partial | P7-T13 |
| NFR-004 Client coverage ≥80% | N/A | Partial | Partial | P7-T13 |
| NFR-005 OWASP | Partial | Partial | Partial | ongoing |
| NFR-006 Observability | Partial | N/A | Partial | P7-T13 |
| NFR-007 Local dev Docker | Done | Done | Done | — |
| NFR-008–009 K8s / IaC | N/A | N/A | Partial | P7-T15 |
| NFR-010–012 CI/CD / GitFlow | Done | Done | Done | — |
| NFR-013 Contract tests | Done | Done | Partial | P7-T13 |
| NFR-014–015 Release / DR | Partial | N/A | Partial | P7-T15 |

---

## Verification sources

| Layer | Primary evidence |
|-------|------------------|
| API | `platform/api/tests/`, `docs/modules/inventory-definition-of-done.md` |
| Web | `clients/web/src/api/emcap-client.test.ts`, `plan/04-client-api-completion.md` |
| Mobile | `clients/mobile/lib/metadata_contract.dart`, manual shell |
| Infra | `infra/helm/`, `infra/terraform/`, `.github/workflows/` |

---

## Traceability

Requirement IDs: `spec/sdd/01-requirements.md`  
Task IDs: `plan/03-task-backlog.md` Phase 7  
Playbook: `plan/06-sdd-gap-closure.md`
