# Windows local development — why issues happen & what to run

One-page guide for EMCAP on **Windows + PowerShell + CMD batch**. Read before debugging `scripts\*.bat`.

## Root causes (not random bugs)

| Category | What goes wrong | What we did |
|----------|----------------|-------------|
| **Batch + PowerShell** | `%~dp0` empty; `timeout` fails when stdin piped | `_resolve-scripts.bat`, `_sleep.bat` |
| **PATH / tooling** | `docker`, `ruff` not global commands | `_find-docker.bat`, `python -m ruff`, `--local` mode |
| **Run location** | Scripts called from wrong folder | Always **repo root**: `scripts\run-emcap.bat` |
| **IDE vs CI linters** | Flake8 (79 cols) on `scripts/` vs Ruff (100) in `platform/api` | Wrap long lines; trust `lint-format.bat` / Ruff for CI |
| **Optional deps** | No Docker, no Flutter | `--local` (SQLite+uvicorn); mobile lint skipped |

## Prerequisites

| Tool | Required? | Check |
|------|-----------|--------|
| Python 3.11+ | Yes | `python --version` |
| Node 20+ / npm | Yes (web) | `node --version` |
| API dev deps | Yes (lint/tests) | auto via `_ensure-python-dev.bat` |
| Docker Desktop | For full stack only | `docker --version` |
| Flutter | Optional | `flutter --version` |

## What to run

```bat
cd C:\path\to\SDD

rem Lint only
scripts\lint-format.bat

rem Full stack WITH Docker
scripts\run-emcap.bat --stack-only

rem Full stack WITHOUT Docker (SQLite + uvicorn)
scripts\run-emcap.bat --stack-only --local

rem Stop
scripts\stop-emcap.bat
```

**Do not pipe** batch files in PowerShell (`| Select-Object`) — run directly in `cmd` or PowerShell.

**Do not use** PowerShell `curl` for health checks — it is `Invoke-WebRequest`. Use `curl.exe` or a browser.

## Helper scripts (do not run directly unless debugging)

| Script | Role |
|--------|------|
| `_resolve-scripts.bat` | Find `scripts\` from `%CD%` |
| `_ensure-python-dev.bat` | `pip install -e ".[dev]"` if needed |
| `_find-docker.bat` | Locate `docker.exe` or print install help |
| `_sleep.bat` | Sleep without `timeout.exe` |
| `start-emcap-local.bat` | SQLite + uvicorn + web |
| `start-emcap-stack.bat` | Docker compose stack |

## Logs

`logs\emcap\<session>\` — `run.log`, `api.log`, `web.log`, `docker-start.log`, `seed.log`

## More detail

- **This machine:** `docs/dev/local-environment.md` (Flutter PATH, API health)
- Pitfalls: `docs/dev/known-pitfalls.md` → Phase 11
- Recipe: `docs/dev/recipes/run-emcap-local-stack.md`
- Playbook: `plan/11-local-dev-tooling.md`
