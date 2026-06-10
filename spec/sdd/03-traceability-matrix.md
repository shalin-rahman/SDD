# EMCAP — Traceability Matrix

Maps requirements → design → tasks → verification. Update when tasks complete.

## Phase 0

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| NFR-007 | `infra/docker/docker-compose.yml` | EMCAP-P0-T03 | `docker compose up` healthy |
| NFR-010 | `.github/workflows/ci.yml` | EMCAP-P0-T06, T07 | CI lint passes |
| NFR-011 | `docs/dev/gitflow.md` | EMCAP-P0-T05 | Branch policy documented |
| FR-003, FR-004, FR-005 | `config/platform.yaml`, config loader | EMCAP-P0-T02, T04 | `GET /api/v1/config/platform` |
| NFR-012 | Ruff/Black/MyPy in CI | EMCAP-P0-T06 | CI job green |

## Phase 1

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-006 | Entity registry | EMCAP-P1-T01–T05 | CUSTOMER CRUD + audit |
| FR-001, FR-002 | Auth providers, RBAC/ABAC | EMCAP-P1-T10–T15 | Auth integration tests |
| FR-003, FR-004 | Tenant middleware + strategies | EMCAP-P1-T20–T25 | Isolation test suite |
| FR-017 | Audit interceptor | EMCAP-P1-T05 | Audit log entries |
| FR-018, FR-019 | ModuleDefinition loader | EMCAP-P1-T06–T08 | Module plug-in without core edits |
| NFR-003 | Unit tests ≥80% | EMCAP-P1-T09 | Coverage report in CI |
| NFR-005 | Security middleware | EMCAP-P1-T17, T18 | OWASP test suite |

## Phase 2

| Req ID | Design | Task ID | Verification |
|--------|--------|---------|--------------|
| FR-007, FR-008 | Form/grid JSON schema | EMCAP-P2-T01–T07 | Contract tests |
| FR-009 | Workflow engine | EMCAP-P2-T09, T10 | Workflow tests |
| FR-010 | Rule engine formulas | EMCAP-P2-T11 | Rule engine tests |
| NFR-013 | Contract test harness | EMCAP-P2-T08 | CI contract job |

## Phase 3–5

| Req ID | Task IDs | Verification |
|--------|----------|--------------|
| FR-011 | EMCAP-P3-T01, T02 | Report execution test |
| FR-012 | EMCAP-P3-T03 | Notification adapter test |
| FR-013 | EMCAP-P3-T04, T05 | Document upload test |
| FR-014 | EMCAP-P3-T06 | Integration adapter test |
| FR-015 | EMCAP-P3-T07 | Payment stub test |
| FR-016 | EMCAP-P3-T08 | AI disabled by default |
| NFR-006 | EMCAP-P3-T09–T11 | Metrics/traces in Grafana |
| NFR-008, NFR-009 | EMCAP-P4-T01–T03 | UAT deploy |
| NFR-014, NFR-015 | `infra/backup/`, `docs/ops/dr-runbook.md`, `docs/ops/release-process.md`, `platform/api/scripts/migrate.py` · EMCAP-P4-T09–T11 | DR drill + `migrate.py status` |
| FR-018 (DoD) | EMCAP-P5-T01–T06 | Zero core changes sign-off |
