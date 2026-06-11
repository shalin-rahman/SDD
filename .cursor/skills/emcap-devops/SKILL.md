---
name: emcap-devops
description: >-
  EMCAP GitFlow, Docker Compose local stack, CI pipeline stages, and IaC layout.
  Use when setting up CI/CD, Docker, Kubernetes, Terraform, or Helm for EMCAP.
---

# EMCAP DevOps

## GitFlow (SDD §24)

| Branch | Purpose |
|--------|---------|
| `main` | Production releases |
| `develop` | Integration branch |
| `release/*` | Release stabilization |
| `hotfix/*` | Production fixes |

See `docs/dev/gitflow.md`.

## Local stack (SDD §21)

```bash
cd infra/docker
docker compose up --build
```

Services: API (:8000), PostgreSQL (:5432), Redis (:6379), MinIO (:9000/:9001).

Health check: `GET http://localhost:8000/api/v1/health`

## CI pipeline (SDD §23)

Stages: Lint → Unit tests → Integration tests → Security scan → Build → Deploy.

Workflow: `.github/workflows/ci.yml` (backend lint + test in Phase 0).

## Code quality (mandatory)

| Stack | Tools |
|-------|-------|
| Python | Ruff, Black, MyPy |
| Angular | ESLint (Phase 2) |
| Flutter | Flutter Analyze (Phase 2) |

## IaC layout (Phase 4)

| Path | Tool |
|------|------|
| `infra/terraform/` | Cloud resources |
| `infra/helm/` | K8s releases |
| `infra/ansible/` | Bootstrap + deploy playbooks (dev/uat inventories) |

## Coverage gates

- Minimum 80% unit coverage (target 90%) — SDD §25
- Contract tests required before client releases
