# Recipe — Run EMCAP local stack (Windows)

## Choose your mode

| You have… | Command |
|-----------|---------|
| **Docker Desktop** | `scripts\run-emcap.bat --stack-only` |
| **No Docker** | `scripts\run-emcap.bat --stack-only --local` |

## Prerequisites

- Python 3.11+, Node 20+, npm
- API dev deps: auto-installed by `lint-format.bat` / `_ensure-python-dev.bat`
- Docker: only for non-`--local` mode
- Optional: Flutter, Chrome (Karma in full `run-emcap.bat`)

## Start

```bat
cd C:\path\to\SDD
scripts\run-emcap.bat --stack-only --local
```

Full pipeline (lint + tests + stack):

```bat
scripts\run-emcap.bat
scripts\run-emcap.bat --local
```

Run **directly** in terminal — do not pipe (`| Select-Object`) batch output.

## URLs

| Service | URL |
|---------|-----|
| API health | http://localhost:8000/api/v1/health |
| Web | http://localhost:4200 |
| Login | `admin` / `admin123` |

**PostgreSQL migrations (Docker mode):** after stack is up, run `docs/dev/recipes/apply-pg-migrations.md` (`python scripts/migrate.py up` with `DATABASE_URL` set).

## Logs

| Output | Location |
|--------|----------|
| Orchestrator | `logs/emcap/<session>/run.log` |
| API (local mode) | **EMCAP API** window + `api.log` |
| Docker (compose mode) | `docker.log` |
| Angular | **EMCAP Web** window + `web.log` |

## Stop

```bat
scripts\stop-emcap.bat
```

## Troubleshooting

See `docs/dev/windows-local-dev.md` and `docs/dev/known-pitfalls.md` → Phase 11.

| Symptom | Fix |
|---------|-----|
| `emcap-env.bat` not recognized | Run from **repo root** |
| `[stack] FAILED` + docker not found | Use `--local` or install Docker |
| `ruff` not recognized | `scripts\lint-format.bat` (uses `python -m ruff`) |
| `Input redirection is not supported` | Don't pipe batch; fixed via `_sleep.bat` |
| Health check in PS | Use `curl.exe`, not `curl` |
