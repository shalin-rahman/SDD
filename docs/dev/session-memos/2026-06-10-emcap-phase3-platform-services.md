# EMCAP Phase 3 — Platform Services Complete

## Goal

Finish Phase 3 of the EMCAP SDD implementation: reporting, notifications, documents, integrations, payments, AI stub, observability, skills, and tests.

## Decisions / constraints

- No git commit before user review
- OpenTelemetry tracing deferred to Phase 4 (Prometheus metrics wired now)
- Document storage uses local filesystem (`EMCAP_STORAGE_PATH`); MinIO integration remains a Phase 4 concern

## What changed

- **Routes:** `reports`, `notifications`, `documents`, `integrations`, `payments`, `ai`, `observability` under `platform/api/src/emcap/api/routes/`
- **main.py:** collectors for reports/dashboards, `JsonLoggingMiddleware`, `MetricsMiddleware`, router registration
- **Demo module:** `CUSTOMER_LIST` report + `CUSTOMER_OVERVIEW` dashboard
- **Dependencies:** `prometheus-client` in `pyproject.toml`
- **Tests:** `tests/test_platform_services.py` (11 tests, feature-flag coverage)
- **Infra:** `infra/grafana/dashboard.json`
- **Skills:** `emcap-integrations`, `emcap-observability`, `emcap-security`
- **Backlog:** Phase 3 tasks marked Done (65/85 total)

## Verification

```powershell
cd platform/api
$env:EMCAP_CONFIG_PATH="..\..\config\platform.yaml"
$env:EMCAP_MODULES_PATH="..\..\modules"
$env:DATABASE_URL="sqlite:///:memory:"
pytest -q    # 33 passed
ruff check src tests
mypy src
```

## Open follow-ups

- Phase 4: Terraform, Helm, full CI/CD, DR
- P0-T07: ESLint/Flutter Analyze in CI
- P0-T05: Git branch protection (needs remote)
- OTEL tracing instrumentation
