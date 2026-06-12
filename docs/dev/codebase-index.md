# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` |
| Local stack (Windows) | `plan/11-local-dev-tooling.md`, `docs/dev/recipes/run-emcap-local-stack.md` |
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
| Seed loader | `platform/api/src/emcap/seed/` | JSON seed apply/purge |
| Business modules | `modules/*/module.py` | Features **only** under `modules/` |
| **Web (Angular CLI)** | `clients/web/src/app/` | Presentation — canonical |
| Web API client | `clients/web/src/app/api/emcap-client.ts` | HTTP methods |
| Web metadata | `clients/web/src/app/metadata/` | Contract + renderers |
| Web pages | `clients/web/src/app/pages/` | Login, shell, entity, platform views |
| Web legacy (archive) | `clients/web-legacy/` | Read-only reference |
| Mobile | `clients/mobile/lib/` | Flutter shell |
| Config | `config/platform.yaml`, `config/platform-test.yaml` | Feature flags, seed |
| Seed JSON | `data/seed/core/`, `data/seed/demo/` | Core + demo data packs |
| Local scripts | `scripts/run-emcap.bat`, `scripts/lint-format.bat` | Dev workflow |
| Run logs | `logs/emcap/<session>/` | gitignored session logs |
| CI | `.github/workflows/ci.yml` | lint, pytest, `ng build`, `ng test:ci` |

---

## Scripts (Windows)

| Script | Purpose |
|--------|---------|
| `scripts/run-emcap.bat` | Lint → tests → Docker stack → seed → web → tail logs |
| `scripts/run-emcap.bat --stack-only` | Skip lint/tests |
| `scripts/stop-emcap.bat` | `docker compose down` + free ports 8000/4200 |
| `scripts/logs-emcap.bat` | Re-follow Docker logs |
| `scripts/lint-format.bat` | ruff/black/mypy + prettier/eslint + dart format |
| `scripts/_resolve-scripts.bat` | Resolve `scripts\` from repo root (PowerShell-safe) |
| `scripts/apply-seed.py` | Apply JSON seed to running Postgres |

**Run from repository root:** `scripts\run-emcap.bat`

---

## Test files

| File | Guards |
|------|--------|
| `platform/api/tests/*.py` | Backend + modules |
| `platform/api/tests/test_seed_loader.py` | JSON seed + demo purge |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter parity |

---

## Verify commands

```powershell
cd C:\path\to\SDD
scripts\lint-format.bat
scripts\run-emcap.bat --stack-only
```

Or layer by layer:

```powershell
cd platform/api; ruff check src tests; black --check src tests; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run format:check; npm run lint; npm run build; npm run test:ci
cd clients/mobile; dart format --output=none --set-exit-if-changed .; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
```

**Gates:** lint-format · pytest 80% · Angular format+lint+build+Karma · flutter test
