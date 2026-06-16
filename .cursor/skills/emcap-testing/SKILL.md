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

## Coverage targets (SDD §25 / NFR-003)

| Layer | Gate | CI command | Baseline (2026-06-16) |
|-------|------|------------|------------------------|
| API | ≥80% lines | `pytest --cov-fail-under=80` | ~91% |
| Web | ≥80% **branches** + lines | `npm run test:coverage` | **80.57%** branches (954/1184), **406** specs |
| Mobile | ≥80% lines | `check-flutter-coverage.py --min 80` | CI only (local Flutter optional) |

Recipe: `docs/dev/recipes/add-coverage-gate.md`. Spec pitfalls: `docs/dev/known-pitfalls.md` § **NFR-003**.

### Web branch coverage — where to add tests

Extend existing specs (high ROI): `entity-record`, `settings`, `workflow`, `entity-list`, `admin-security`, `reports`, `document-preview.util`, `dynamic-form.renderer`, `metadata/contract.spec.ts`, shared utils.

- Call public component methods for both branches (`selectPaymentProvider`, `reload`, `canPostMovement`).
- `await fixture.whenStable()` after async `restoreRecord()` before mutating `formValues`.
- Router tests: provide `app/entity/:code` **and** `app/entity/:code/:recordId`.
- Do not spy ES module exports — assert component state (`historyError`, `isDownloading`).

## Test layout

| Path | Purpose |
|------|---------|
| `platform/api/tests/` | pytest suite |
| `platform/api/tests/test_seed_loader.py` | JSON seed apply + demo purge |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/api/emcap-client.http.spec.ts` | Fetch mock + SSE stream |
| `clients/web/src/app/guards/guards.spec.ts` | `authGuard`, `adminGuard`, `settingsGuard` |
| `clients/web/src/app/services/shell-nav.util.spec.ts` | Module nav filter/group |
| `clients/web/src/app/shared/utils/page-title.util.spec.ts` | Page title from route |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer + conditions |
| `clients/web/src/app/metadata/contract.spec.ts` | Label resolution + `??` fallbacks |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter parity |

## Web (Angular)

```powershell
scripts\lint-format.bat
cd clients/web
npm run format:check
npm run lint
npm run build
npm run test:ci    # CI: ChromeHeadless, no watch — 406 specs
npm run test:coverage   # enforces karma.conf.js branch/line gates
```

Pytest uses `config/platform-test.yaml` (demo seed off). Local stack uses `config/platform.yaml`.

Windows issues (ruff PATH, batch pipes): `docs/dev/windows-local-dev.md`.

Do not use `clients/web-legacy` vitest in CI — archived.

## CI

| Job | Command |
|-----|---------|
| `backend` | `pytest --cov-fail-under=80` |
| `client-lint-web` | `format:check`, `lint`, `build`, `test:ci`, `test:coverage` |
| Local (Windows) | `scripts\lint-format.bat` then `scripts\run-emcap.bat` |
| `client-lint-mobile` | `flutter test --coverage` + `check-flutter-coverage.py --min 80` |

## Run all locally

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run build; npm run test:ci; npm run test:coverage
cd clients/mobile; flutter test --coverage
python scripts/check-flutter-coverage.py --lcov clients/mobile/coverage/lcov.info --min 80
```
