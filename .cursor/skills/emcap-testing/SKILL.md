---
name: emcap-testing
description: >-
  EMCAP testing strategy including unit tests, contract tests for metadata
  renderers, workflow/rule tests, and CI coverage gates. Use when adding tests
  or verifying SDD quality requirements.
---

# EMCAP Testing

## Coverage targets (SDD §25)

- Backend unit tests: ≥80% (target 90%)
- Angular / Flutter: ≥80%
- Contract tests: mandatory for metadata parity

## Test layout

| Path | Purpose |
|------|---------|
| `platform/api/tests/test_health.py` | API smoke |
| `platform/api/tests/test_entity_registry.py` | Entity SDK |
| `platform/api/tests/test_auth_security.py` | Auth, tenancy, security |
| `platform/api/tests/test_metadata_workflow.py` | Metadata contract, workflow, rules |
| `platform/api/tests/test_client_api_gaps.py` | Notes, sync, workflow GET, documents, SSE, LOW_STOCK |
| `platform/api/tests/test_inventory_e2e.py` | Inventory module E2E |
| `platform/api/tests/test_platform_core_unchanged.py` | Plug-in model — no accidental core edits |

## Contract test pattern

1. Fetch metadata from API
2. Assert required keys match client contract
3. Compare field/column names to fixture JSON in `tests/fixtures/metadata/`

## CI

`.github/workflows/ci.yml` runs pytest with:

```
EMCAP_CONFIG_PATH, EMCAP_MODULES_PATH, DATABASE_URL=sqlite:///:memory:
```

## Run locally

```bash
cd platform/api
pytest -q
```
