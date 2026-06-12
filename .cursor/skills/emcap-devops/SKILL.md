---
name: emcap-devops
description: >-
  EMCAP GitFlow, Docker Compose local stack, CI pipeline stages, and IaC layout.
  Use when setting up CI/CD, Docker, Kubernetes, Terraform, or Helm for EMCAP.
---

# EMCAP DevOps

## GitFlow (SDD §24)

See `docs/dev/gitflow.md`.

## Windows local dev (read first on Windows)

**Guide:** `docs/dev/windows-local-dev.md`

**Always from repo root:**

```bat
scripts\lint-format.bat
scripts\run-emcap.bat --stack-only --local    rem no Docker
scripts\run-emcap.bat --stack-only              rem needs Docker Desktop
```

| If… | Then… |
|-----|--------|
| `docker` not recognized | Use `--local` or install Docker Desktop |
| `ruff` not recognized | Scripts use `python -m ruff`; run `lint-format.bat` |
| `emcap-env.bat` not found | Wrong cwd — run from repo root, not `scripts\` |
| `Input redirection` error | Don't pipe batch files; use `_sleep.bat` not `timeout` |
| IDE Flake8 on `scripts/*.py` | Wrap lines; CI uses Ruff in `platform/api` |

## Local stack

| Mode | Command | API DB |
|------|---------|--------|
| Docker | `scripts\run-emcap.bat --stack-only` | PostgreSQL in compose |
| Local | `scripts\run-emcap.bat --stack-only --local` | SQLite `emcap-local.db` |

- Web: http://localhost:4200 · API: http://localhost:8000 · `admin` / `admin123`
- Logs: `logs/emcap/<session>/`
- Recipe: `docs/dev/recipes/run-emcap-local-stack.md`

**Manual (Docker):** `cd infra/docker && docker compose up --build`

## Lint before test

```bat
scripts\lint-format.bat
```

Uses `python -m ruff|black|mypy` + `npm run format:check|lint` (+ flutter if on PATH).

## CI pipeline (SDD §23)

`.github/workflows/ci.yml` — quote `DATABASE_URL: "sqlite:///:memory:"` in YAML.

## IaC

`infra/terraform/`, `infra/helm/`, `infra/ansible/`, `infra/backup/`

## References

- `plan/11-local-dev-tooling.md`
- `docs/dev/known-pitfalls.md` → Phase 11
- `data/seed/README.md`
