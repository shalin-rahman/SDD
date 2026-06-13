# EMCAP Phase 4 — Sub-Agent Parallel Execution

## Goal

Run Phase 4 (DevOps & Production) via parallel sub-agents on independent workstreams.

## Orchestration

**Wave 1 (4 agents in parallel):**
| Agent | Tasks | Deliverable |
|-------|-------|-------------|
| Terraform | P4-T01 | `infra/terraform/` modules + dev env |
| CI security | P4-T04, P4-T05 | Extended `ci.yml`, integration tests |
| Helm | P4-T02 | `infra/helm/emcap-api/` chart |
| Release/DR | P4-T09–T12 | backup scripts, DR runbook, migrate.py, skill |

**Wave 2 (2 agents in parallel):**
| Agent | Tasks | Deliverable |
|-------|-------|-------------|
| Ansible | P4-T03 | `infra/ansible/` playbooks |
| Deploy CI | P4-T06–T08 | `deploy-dev/uat/production.yml` workflows |

## Post-merge fix

- Fixed `test_postgres_integration.py` response shape (`email` at top level, not `data.email`)

## Verification

```
pytest -q   # 36 passed
ruff check src tests
```

## Result

Phase 4: **12/12 Done** (77/85 total). Phase 5 next.

## Constraints

- No git commits (user review pending)

## Open follow-ups

- Configure GitHub secrets: `REGISTRY_TOKEN`, `KUBE_CONFIG`, env-specific DB/JWT secrets
- Create GitHub Environments: dev, uat (approval), production (approval)
- Phase 5 reference module
