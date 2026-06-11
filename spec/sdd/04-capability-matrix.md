# EMCAP — Capability Matrix (SDD §2–§3)

Maps each SDD platform goal to **API · Web · Mobile · Infra** status.

**Legend:** Done · Partial · Stub (API/route only) · No · N/A

**Last updated:** 2026-06-11 · Phases 7–8 complete. **End-user UX:** `spec/sdd/05-end-user-matrix.md`.

---

## Functional goals (SDD §2)

| Goal | API | Web | Mobile | Infra | Notes |
|------|-----|-----|--------|-------|-------|
| Authentication | Done | Done | Done | N/A | MFA + OAuth in shells (P8) |
| Authorization | Done | Done | Done | N/A | Permissions viewer (P7) |
| Multi-tenancy | Done | Done | Done | Partial | Tenant picker + themes (P8); prod Helm partial |
| Dynamic menus | Done | Done | Done | N/A | — |
| Dynamic forms | Done | Done | Done | N/A | Validation, i18n (P8) |
| Dynamic grids | Done | Done | Done | N/A | Sort/filter/group/export (P8) |
| Workflow | Done | Done | Done | N/A | Actions + start from record (P7–P8) |
| Reporting | Done | Done | Done | N/A | Run + history (P8) |
| Dashboards | Done | Done | Done | N/A | — |
| Notifications | Done | Done | Done | N/A | Multi-channel UI (P8) |
| Documents | Done | Done | Done | N/A | Upload + preview (P7–P8) |
| Auditing | Done | Done | Done | N/A | — |
| Integrations | Stub | Done | Done | N/A | Dispatch UI; API stub |
| Payments | Stub | Done | Done | N/A | Demo UI when flag on; API stub |

### Notes

- **Stub (integrations/payments):** routes exist; real gateway adapters not production-hardened; `payments.enabled: false` default.
- **Partial (infra):** production cutover checklist in `docs/ops/production-readiness.md` — study-repo tabletop done; live sign-off pending.

---

## Platform modes (SDD §3)

| Mode | Config | API | Web / Mobile | Infra | Notes |
|------|--------|-----|--------------|-------|-------|
| Single org (`multi_tenant: false`) | Done | Done | Done | Done (dev) | — |
| SaaS (`multi_tenant: true`) | Done | Done | Done | Partial (prod Helm) | Tenant picker (P8) |
| Enterprise white-label | Done | Done | Done | Partial (prod values) | CSS var / `ThemeData` (P8) |

---

## Non-functional goals (SDD §2)

| NFR | API | Web / Mobile | Infra | Notes |
|-----|-----|--------------|-------|-------|
| NFR-001 Availability 99.9% | Partial | N/A | Partial | Helm prod values; live sign-off pending |
| NFR-002 Scalability | Partial | N/A | Partial | HPA documented |
| NFR-003 Backend coverage ≥80% | Done | N/A | Done | CI `--cov-fail-under=80` |
| NFR-004 Client coverage ≥80% | N/A | Done | Done | Vitest + Flutter contract tests in CI |
| NFR-005 OWASP | Partial | Partial | Partial | ongoing |
| NFR-006 Observability | Partial | N/A | Partial | Prometheus metrics |
| NFR-007 Local dev Docker | Done | Done | Done | — |
| NFR-008–009 K8s / IaC | N/A | N/A | Partial | Terraform + Helm |
| NFR-010–012 CI/CD / GitFlow | Done | Done | Done | lint + test in CI |
| NFR-013 Contract tests | Done | Done | Done | API + renderer tests |
| NFR-014–015 Release / DR | Partial | N/A | Partial | DR runbook; tabletop verified |

---

## Verification sources

| Layer | Primary evidence |
|-------|------------------|
| API | `platform/api/tests/` (60 tests, ~90% cov) |
| Web | `emcap-client.test.ts`, `dynamic-form/grid.component.test.ts` |
| Mobile | `test/metadata_contract_test.dart`, `flutter test` in CI |
| End-user UX | `spec/sdd/05-end-user-matrix.md` |
| Infra | `infra/helm/`, `.github/workflows/`, `docs/ops/production-readiness.md` |

---

## Traceability

Requirement IDs: `spec/sdd/01-requirements.md`  
Task IDs: `plan/03-task-backlog.md` (Phases 7–8)  
Playbooks: `plan/06-sdd-gap-closure.md`, `plan/07-phase8-end-user-product.md`
