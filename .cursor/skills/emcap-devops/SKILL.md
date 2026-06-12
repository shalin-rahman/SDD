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

**Windows (recommended):**

```bat
cd C:\path\to\SDD
scripts\run-emcap.bat --stack-only
```

- API: http://localhost:8000
- Web: http://localhost:4200 (`admin` / `admin123`)
- Logs: `logs/emcap/<session>/`
- Recipe: `docs/dev/recipes/run-emcap-local-stack.md`

**Manual:**

```bash
cd infra/docker && docker compose up --build
cd clients/web && npm start
```

## Lint before test (Phase 11)

```bat
scripts\lint-format.bat
```

| Stack | Tools |
|-------|-------|
| Python | ruff, black --check, mypy |
| Web | prettier --check, ng lint |
| Mobile | dart format, flutter analyze |

## CI pipeline (SDD §23)

Workflow: `.github/workflows/ci.yml`

| Job | Stack |
|-----|-------|
| `backend` | Ruff, Black, MyPy, pytest 80% |
| `integration` | PostgreSQL (`DATABASE_URL` **quoted** in YAML) |
| `security-*` | pip-audit, Bandit, Ruff S |
| `client-lint-web` | format:check, lint, build, test:ci |
| `client-lint-mobile` | dart format, analyze, test |

## Windows batch pitfalls

- Run `scripts\*.bat` from **repo root**, not from inside `scripts\`.
- Do not rely on `%~dp0` alone from PowerShell — use `scripts/_resolve-scripts.bat`.
- Quote `sqlite:///:memory:` in GitHub Actions YAML.

See `docs/dev/known-pitfalls.md` → Phase 11.

## IaC

`infra/terraform/`, `infra/helm/`, `infra/ansible/`, `infra/backup/`

## References

- `plan/11-local-dev-tooling.md` — run-emcap, seed, logs
- `plan/10-angular-cli-web.md` — Angular scaffold pitfalls
- `data/seed/README.md` — JSON seed configuration
