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

Web shell: `cd clients/web && npm run dev` → http://localhost:4200

## CI pipeline (SDD §23)

Stages: Lint → Unit tests → Integration tests → Security scan → Client tests → Deploy.

Workflow: `.github/workflows/ci.yml`

| Job | Stack |
|-----|-------|
| `backend` | Ruff, Black, MyPy, pytest 80% coverage |
| `integration` | PostgreSQL service container |
| `security-dependencies` | pip-audit |
| `security-sast` | Bandit + Ruff S |
| `client-lint-web` | ESLint + vitest |
| `client-lint-mobile` | flutter analyze + flutter test |

## Code quality (mandatory)

| Stack | Tools |
|-------|-------|
| Python | Ruff, Black, MyPy |
| Web (Vite/TS) | ESLint, vitest |
| Flutter | Flutter Analyze, flutter test |

## IaC layout

| Path | Tool |
|------|------|
| `infra/terraform/` | Cloud resources |
| `infra/helm/` | K8s releases |
| `infra/ansible/` | Bootstrap + deploy playbooks (dev/uat inventories) |
| `infra/backup/` | Daily backup + PITR scripts |

## Coverage gates

- Backend: `--cov-fail-under=80` in CI (current ~90%)
- Client: vitest + `metadata_contract_test.dart` on every PR
- Production tabletop: `docs/ops/production-readiness.md`
