# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` (131/131 Done) |
| Phase 7 platform services | `plan/06-sdd-gap-closure.md` |
| Phase 8 end-user UX | `plan/07-phase8-end-user-product.md` |
| Platform service status | `spec/sdd/04-capability-matrix.md` |
| End-user UX status | `spec/sdd/05-end-user-matrix.md` |
| Client API mapping | `plan/04-client-api-completion.md` |
| Req → test trace | `spec/sdd/03-traceability-matrix.md` |
| Pitfalls / regressions | `docs/dev/known-pitfalls.md` |
| How-to recipes | `docs/dev/recipes/` |
| SaaS / white-label | `docs/dev/saas-shell.md` |
| Production cutover | `docs/ops/production-readiness.md` |

---

## Monorepo zones

| Zone | Key paths | When to touch |
|------|-----------|---------------|
| Platform API routes | `platform/api/src/emcap/api/routes/*.py` | New generic HTTP surface |
| Platform services | `platform/api/src/emcap/{notes,sync,documents,reporting,workflow,...}/` | Business-agnostic logic |
| App bootstrap | `platform/api/src/emcap/main.py` | Router includes, CORS, middleware |
| Entity SDK | `platform/api/src/emcap/entity/`, `module/` | Registry, loader, models |
| Auth / tenancy | `platform/api/src/emcap/auth/`, `tenancy/` | JWT, RBAC, tenant middleware |
| Metadata | `platform/api/src/emcap/metadata/` | Form/grid JSON builders |
| Persistence | `platform/api/src/emcap/persistence/` | SQLAlchemy repos, migrations |
| Business modules | `modules/{inventory,crm,demo}/module.py` | Features **only** under `modules/` |
| Web client API | `clients/web/src/api/emcap-client.ts` | HTTP client (40+ methods) |
| Web shell | `clients/web/src/app/main.ts`, `entity-view.ts` | Presentation views |
| Web renderers | `clients/web/src/dynamic-form.component.ts`, `dynamic-grid.component.ts` | Metadata renderers |
| Mobile client | `clients/mobile/lib/api/emcap_client.dart`, `lib/app/*.dart` | Flutter shell |
| Mobile theme | `clients/mobile/lib/theme.dart` | White-label `ThemeData` seed |
| Metadata contract | `clients/web/src/metadata/contract.ts`, `clients/mobile/lib/metadata_contract.dart` | Shared types |
| Config | `config/platform.yaml` | Feature flags, auth, modules |
| Docker local | `infra/docker/` | Compose stack |
| CI | `.github/workflows/ci.yml` | Lint, pytest 80%, vitest, flutter test |
| Helm / Terraform | `infra/helm/`, `infra/terraform/` | Production IaC |

---

## Test files

| File | Guards |
|------|--------|
| `test_health.py` | API smoke, menus, permissions |
| `test_auth_security.py` | Auth, RBAC, MFA, OAuth, tenancy |
| `test_metadata_workflow.py` | Metadata contract, workflow, rules |
| `test_client_api_gaps.py` | Notes, sync, SSE, documents, workflow GET |
| `test_inventory_e2e.py` | Inventory module end-to-end |
| `test_crm_e2e.py` | CRM module (LEAD, CONTACT) |
| `test_platform_core_unchanged.py` | Plug-in model guard |
| `clients/web/src/api/emcap-client.test.ts` | Client method contract |
| `clients/web/src/dynamic-form.component.test.ts` | Form validation, conditions |
| `clients/web/src/dynamic-grid.component.test.ts` | Sort, filter, paginate |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter renderer parity |

---

## Verify commands

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run lint; npm test
cd clients/mobile; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
.\scripts\verify-platform-core.ps1
```

**Current gates:** 60 pytest · 8 vitest · 3 flutter tests · backend ~90% coverage.
