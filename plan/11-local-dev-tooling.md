# Phase 11 — Local dev tooling (scripts, seed, lint gates)

**Status:** Complete — 2026-06-12

## Delivered

| Item | Path |
|------|------|
| Full run (lint → tests → stack → logs) | `scripts/run-emcap.bat` |
| Stack only | `scripts/run-emcap.bat --stack-only` |
| Stop stack | `scripts/stop-emcap.bat` |
| Re-attach Docker logs | `scripts/logs-emcap.bat` |
| Lint/format gate | `scripts/lint-format.bat` (.ps1 / .sh) |
| Path resolver (PowerShell-safe) | `scripts/_resolve-scripts.bat` |
| JSON seed packs | `data/seed/core/`, `data/seed/demo/` |
| Seed loader | `platform/api/src/emcap/seed/loader.py` |
| Test profile (no demo seed) | `config/platform-test.yaml` |
| Web live + file logs | `scripts/run-web-with-logs.ps1` |
| No-Docker local stack | `scripts/start-emcap-local.bat`, `--local` flag |
| Helpers | `_resolve-scripts`, `_ensure-python-dev`, `_find-docker`, `_sleep` |
| Windows guide | `docs/dev/windows-local-dev.md` |

## Run (Windows)

**Always from repository root** (see `docs/dev/windows-local-dev.md`):

```bat
cd C:\path\to\SDD
scripts\run-emcap.bat
scripts\run-emcap.bat --stack-only
scripts\run-emcap.bat --stack-only --local
```

Logs: `logs/emcap/<session>/` (`run.log`, `docker.log`, `web.log`, …). Pointer: `logs/emcap/latest.txt`.

## Flags

| Flag | Effect |
|------|--------|
| `--stack-only` | Skip lint and tests |
| `--skip-lint` | Skip lint-format only |
| `--skip-tests` | Skip pytest / web / flutter tests |
| `--no-follow` | Start stack; pause instead of tailing Docker logs |
| `--local` | SQLite + uvicorn (no Docker) |

## Configuration

`config/platform.yaml` → `seed.core` / `seed.demo`. Set `seed.demo.enabled: false` to skip demo data; `remove_when_disabled: true` purges demo record IDs from JSON.

## Pitfalls learned

See `docs/dev/known-pitfalls.md` → **Phase 11** and recipe `docs/dev/recipes/run-emcap-local-stack.md`.
