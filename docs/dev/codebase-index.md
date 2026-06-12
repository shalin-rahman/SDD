# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` |
| Angular web client | `plan/10-angular-cli-web.md`, ADR-005 |
| Phase 8 end-user UX | `plan/07-phase8-end-user-product.md` |
| Platform service status | `spec/sdd/04-capability-matrix.md` |
| End-user UX status | `spec/sdd/05-end-user-matrix.md` |
| Client API mapping | `plan/04-client-api-completion.md` |
| Pitfalls / regressions | `docs/dev/known-pitfalls.md` |
| How-to recipes | `docs/dev/recipes/` |

---

## Monorepo zones

| Zone | Key paths | When to touch |
|------|-----------|---------------|
| Platform API | `platform/api/src/emcap/` | Generic HTTP + services |
| Business modules | `modules/*/module.py` | Features **only** under `modules/` |
| **Web (Angular CLI)** | `clients/web/src/app/` | Presentation — canonical |
| Web API client | `clients/web/src/app/api/emcap-client.ts` | HTTP methods |
| Web metadata | `clients/web/src/app/metadata/` | Contract + renderers |
| Web pages | `clients/web/src/app/pages/` | Login, shell, entity, platform views |
| Web legacy (archive) | `clients/web-legacy/` | Read-only reference |
| Mobile | `clients/mobile/lib/` | Flutter shell |
| Config | `config/platform.yaml` | Feature flags |
| CI | `.github/workflows/ci.yml` | pytest, `ng build`, `ng test:ci`, flutter |

---

## Test files

| File | Guards |
|------|--------|
| `platform/api/tests/*.py` | Backend + modules |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter parity |

---

## Verify commands

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run build; npm run test:ci
cd clients/mobile; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
```

**Gates:** pytest 80% · Angular build + Karma CI · flutter test
