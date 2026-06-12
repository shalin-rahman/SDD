---
name: emcap-testing
description: >-
  EMCAP testing strategy including unit tests, contract tests for metadata
  renderers, workflow/rule tests, and CI coverage gates. Use when adding tests
  or verifying SDD quality requirements.
---

# EMCAP Testing

## Coverage targets (SDD §25)

- Backend: ≥80% CI gate (~90%)
- Web: Karma contract tests (Angular CLI)
- Mobile: `metadata_contract_test.dart`
- Metadata parity mandatory across web and mobile

## Test layout

| Path | Purpose |
|------|---------|
| `platform/api/tests/` | pytest suite |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter parity |

## Web (Angular)

```powershell
cd clients/web
npm run build
npm run test:ci    # CI: ChromeHeadless, no watch
npm test           # local: opens browser
```

Do not use `clients/web-legacy` vitest in CI — archived.

## CI

| Job | Command |
|-----|---------|
| `backend` | `pytest --cov-fail-under=80` |
| `client-lint-web` | `npm run build && npm run test:ci` |
| `client-lint-mobile` | `flutter test` |

## Run all locally

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run build; npm run test:ci
cd clients/mobile; flutter test
```
