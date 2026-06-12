# Recipe — Run EMCAP local stack (Windows)

## Prerequisites

- Docker Desktop running
- Python 3.11+, Node 20+, npm
- Optional: Flutter SDK, Chrome (Karma)

## Start

```bat
cd C:\path\to\SDD
scripts\run-emcap.bat --stack-only
```

Full pipeline (lint + tests + stack + live logs):

```bat
scripts\run-emcap.bat
```

## URLs

| Service | URL |
|---------|-----|
| API health | http://localhost:8000/api/v1/health |
| Web | http://localhost:4200 |
| Login | `admin` / `admin123` |

## Logs

| Output | Location |
|--------|----------|
| Orchestrator | `logs/emcap/<session>/run.log` |
| Docker services | `logs/emcap/<session>/docker.log` (live tail + file) |
| Angular | **EMCAP Web** window + `web.log` |
| Latest session | `logs/emcap/latest.txt` |

Re-attach Docker logs: `scripts\logs-emcap.bat`

## Stop

```bat
scripts\stop-emcap.bat
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `emcap-env.bat` not recognized | Run from **repo root**, not `scripts\` |
| Window closes immediately | Script now `pause`s; check `run.log` under `logs/emcap/` |
| `[stack] FAILED` | Start Docker Desktop; see `docker-start.log` in session folder |
| Web not opening | Check **EMCAP Web** PowerShell window; see `web.log` |
| Demo data in pytest | Tests use `config/platform-test.yaml` (demo seed off) |

Details: `docs/dev/known-pitfalls.md` → Phase 11.
