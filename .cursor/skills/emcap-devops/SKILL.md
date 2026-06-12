---
name: emcap-devops
description: >-
  EMCAP GitFlow, Docker Compose local stack, CI pipeline stages, and IaC layout.
  Use when setting up CI/CD, Docker, Kubernetes, Terraform, or Helm for EMCAP.
---

# EMCAP DevOps

## GitFlow (SDD §24)

See `docs/dev/gitflow.md`.

## Local stack (SDD §21)

```bash
cd infra/docker
docker compose up --build
cd clients/web && npm start    # Angular → :4200
```

## CI pipeline (SDD §23)

Workflow: `.github/workflows/ci.yml`

| Job | Stack |
|-----|-------|
| `backend` | Ruff, Black, MyPy, pytest 80% |
| `integration` | PostgreSQL |
| `security-*` | pip-audit, Bandit, Ruff S |
| `client-lint-web` | `ng build` + `ng test:ci` (ChromeHeadless) |
| `client-lint-mobile` | flutter analyze + test |

## Code quality

| Stack | Tools |
|-------|-------|
| Python | Ruff, Black, MyPy |
| Web (Angular) | Angular CLI build, Karma/Jasmine |
| Flutter | Flutter Analyze, flutter test |

## Angular web CI prerequisites

- `browser-actions/setup-chrome` in workflow (Karma headless).
- `clients/web`: `npm run test:ci` not interactive `ng test`.

## IaC

`infra/terraform/`, `infra/helm/`, `infra/ansible/`, `infra/backup/`

## References

- `plan/10-angular-cli-web.md` — scaffold pitfalls (npm path, TS4111)
