---
name: emcap-testing
description: >-
  EMCAP testing strategy including unit tests, contract tests for metadata
  renderers, workflow/rule tests, and CI coverage gates. Use when adding tests
  or verifying SDD quality requirements.
---

# EMCAP Testing

## Phase 12 tests (FR-008d)

| Path | Purpose |
|------|---------|
| `tests/test_admin_users.py` | Admin user CRUD + 403 (add in P12B) |
| `tests/test_admin_settings.py` | Settings PUT + audit (add in P12C) |
| `clients/web/src/app/services/shell-nav.util.spec.ts` | Nav filter + module groups |
| `clients/web/src/app/shared/utils/page-title.util.spec.ts` | Toolbar title |

**DoD:** `plan/12-phase12-dod-checklist.md` + **`sync-docs-after-change.md`** same PR.

## Coverage targets (SDD §25)

- Backend: ≥80% CI gate (~90%)
- Web: Karma contract tests (Angular CLI)
- Mobile: `metadata_contract_test.dart`
- Metadata parity mandatory across web and mobile

## Test layout

| Path | Purpose |
|------|---------|
| `platform/api/tests/` | pytest suite |
| `platform/api/tests/test_seed_loader.py` | JSON seed apply + demo purge |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/services/shell-nav.util.spec.ts` | Module nav filter/group |
| `clients/web/src/app/shared/utils/page-title.util.spec.ts` | Page title from route |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter parity |

## Web (Angular)

```powershell
scripts\lint-format.bat
cd clients/web
npm run format:check
npm run lint
npm run build
npm run test:ci    # CI: ChromeHeadless, no watch
```

Pytest uses `config/platform-test.yaml` (demo seed off). Local stack uses `config/platform.yaml`.

Windows issues (ruff PATH, batch pipes): `docs/dev/windows-local-dev.md`.

Do not use `clients/web-legacy` vitest in CI — archived.

## CI

| Job | Command |
|-----|---------|
| `backend` | `pytest --cov-fail-under=80` |
| `client-lint-web` | `format:check`, `lint`, `build`, `test:ci` |
| Local (Windows) | `scripts\lint-format.bat` then `scripts\run-emcap.bat` |
| `client-lint-mobile` | `flutter test` |

## Run all locally

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run build; npm run test:ci
cd clients/mobile; flutter test
```
