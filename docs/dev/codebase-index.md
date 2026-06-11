# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` |
| Phase 6 steps | `plan/05-phase6-playbook.md` |
| Phase 7 SDD gaps | `plan/06-sdd-gap-closure.md` |
| Capability status | `spec/sdd/04-capability-matrix.md` |
| Client API mapping | `plan/04-client-api-completion.md` |
| Req → test trace | `spec/sdd/03-traceability-matrix.md` |
| Pitfalls / regressions | `docs/dev/known-pitfalls.md` |
| How-to recipes | `docs/dev/recipes/` (incl. workflow, audit, notifications, coverage) |
| SaaS / white-label | `docs/dev/saas-shell.md` |

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
| Business modules | `modules/<name>/module.py`, `deploy/manifest.yaml` | Inventory-style features **only** |
| Web client | `clients/web/src/api/emcap-client.ts`, `src/app/main.ts` | Vite + TS presentation shell |
| Mobile client | `clients/mobile/lib/api/emcap_client.dart`, `lib/app/` | Flutter presentation shell |
| Metadata contract | `clients/web/src/metadata/contract.ts`, `clients/mobile/lib/metadata_contract.dart` | Shared form/grid types |
| Config | `config/platform.yaml` | Feature flags, auth, modules |
| Docker local | `infra/docker/` | Compose stack |
| CI | `.github/workflows/ci.yml`, `deploy-*.yml` | Lint, test, deploy |
| Ansible | `infra/ansible/` | Bootstrap + deploy playbooks |
| Terraform | `infra/terraform/` | Cloud modules |
| Helm | `infra/helm/emcap-api/` | K8s chart |
| Cursor assets | `.cursor/rules/`, `.cursor/skills/` | Agent guidance (project-local) |

---

## Test files

| File | Guards |
|------|--------|
| `test_health.py` | API smoke, config introspection |
| `test_entity_registry.py` | EntityDefinition registry |
| `test_auth_security.py` | Auth, RBAC, tenancy, rate limit |
| `test_metadata_workflow.py` | Metadata contract, workflow, rules |
| `test_platform_services.py` | Reports, notifications, documents |
| `test_client_api_gaps.py` | Notes, sync, workflow GET, documents list, SSE, LOW_STOCK |
| `test_inventory_e2e.py` | Inventory module end-to-end |
| `test_platform_core_unchanged.py` | P5 plug-in model — no accidental core edits |
| `test_postgres_integration.py` | Postgres integration (CI optional) |

---

## Verify commands

```powershell
cd platform/api; python -m pytest -q
cd clients/web; npm run lint; npm test
.\scripts\verify-full-stack.ps1
.\scripts\verify-platform-core.ps1
```

Flutter (when SDK on PATH):

```powershell
cd clients/mobile; flutter analyze
```
