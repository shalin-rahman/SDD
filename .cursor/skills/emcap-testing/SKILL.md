---
name: emcap-testing
description: >-
  EMCAP testing strategy including unit tests, contract tests for metadata
  renderers, workflow/rule tests, and CI coverage gates. Use when adding tests
  or verifying SDD quality requirements.
---

# EMCAP Testing

## Coverage targets (SDD §25)

- Backend unit tests: ≥80% CI gate (current ~90%)
- Web vitest + Flutter contract tests: mandatory for renderer parity
- Contract tests: mandatory for metadata parity across web and mobile

## Test layout

| Path | Purpose |
|------|---------|
| `platform/api/tests/test_health.py` | API smoke, menus, permissions |
| `platform/api/tests/test_entity_registry.py` | Entity SDK |
| `platform/api/tests/test_auth_security.py` | Auth, RBAC, MFA, OAuth, tenancy |
| `platform/api/tests/test_metadata_workflow.py` | Metadata contract, workflow, rules |
| `platform/api/tests/test_client_api_gaps.py` | Notes, sync, workflow GET, documents, SSE, LOW_STOCK |
| `platform/api/tests/test_inventory_e2e.py` | Inventory module E2E |
| `platform/api/tests/test_crm_e2e.py` | CRM module (LEAD, CONTACT) |
| `platform/api/tests/test_platform_core_unchanged.py` | Plug-in model — no accidental core edits |
| `clients/web/src/api/emcap-client.test.ts` | Client method contract |
| `clients/web/src/dynamic-form.component.test.ts` | Form validation, conditions |
| `clients/web/src/dynamic-grid.component.test.ts` | Sort, filter, paginate |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter renderer parity |

## Contract test pattern

1. Fetch metadata from API (or use fixture JSON)
2. Assert required keys match client contract
3. Compare field/column names to fixture JSON in `tests/fixtures/metadata/`
4. Mirror assertions in vitest and `metadata_contract_test.dart`

## CI

`.github/workflows/ci.yml`:

| Job | Gate |
|-----|------|
| `backend` | Ruff, Black, MyPy, pytest `--cov-fail-under=80` |
| `integration` | pytest `-m integration` against PostgreSQL |
| `security-dependencies` | pip-audit |
| `security-sast` | Bandit + Ruff S rules |
| `client-lint-web` | ESLint + vitest |
| `client-lint-mobile` | `flutter analyze` + `flutter test` |

Env: `EMCAP_CONFIG_PATH`, `EMCAP_MODULES_PATH`, `DATABASE_URL=sqlite:///:memory:`

## Run locally

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run lint; npm test
cd clients/mobile; flutter analyze; flutter test
```
