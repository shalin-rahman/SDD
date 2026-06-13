# EMCAP session summary — run scripts, seed, lint, pitfalls (2026-06-12)

## Goal
Close local-dev gaps: one-command Windows runner (tests → stack → web → logs), JSON seed data, lint/format gates, fix script/CI failures, document everything in backlog + pitfalls.

## Constraints
- **Do not commit** until user review.
- Business code in `modules/` only; seed loader is platform infrastructure (already in `platform/api/src/emcap/seed/`).

---

## What was built

### Scripts (`scripts/`)
| File | Purpose |
|------|---------|
| `run-emcap.bat` | Lint → tests → Docker stack → seed → web → tail Docker logs |
| `run-emcap.bat --stack-only` | Skip lint/tests |
| `run-emcap.bat --no-follow` | No docker log tail at end |
| `stop-emcap.bat` | `docker compose down` + kill ports 8000/4200 |
| `logs-emcap.bat` | Re-attach Docker logs |
| `lint-format.bat` / `.ps1` / `.sh` | ruff/black/mypy + prettier/eslint + dart/flutter |
| `_resolve-scripts.bat` | Find `scripts\` via `%CD%\scripts\` (PowerShell-safe) |
| `_ensure-python-dev.bat` | `pip install -e ".[dev]"` if `python -m ruff` missing |
| `apply-seed.py` | Apply JSON seed to Postgres |
| `run-web-with-logs.ps1` | `npm start` with Tee-Object → `web.log` |
| `start-emcap-stack.bat` | Stack-only orchestration |

**Always run from repo root:** `cd SDD` then `scripts\run-emcap.bat`

### Seed data
- `data/seed/core/` — roles.json, users.json (admin/operator/viewer)
- `data/seed/demo/` — products, CRM, HRM, accounting, POS, etc.
- `config/platform.yaml` → `seed.core` / `seed.demo` (demo removable when disabled)
- `config/platform-test.yaml` — demo seed **off** for pytest (`conftest.py`)
- Loader: `platform/api/src/emcap/seed/loader.py` + startup in `main.py`
- Tests: `platform/api/tests/test_seed_loader.py`

### Lint / format (Phase 11)
- Angular: `eslint.config.js`, `.prettierrc`, `npm run lint`, `format:check`
- CI: `format:check` + `lint` before build/test; quoted `DATABASE_URL: "sqlite:///:memory:"`
- Python scripts use **`python -m ruff`** not bare `ruff` (not on global PATH)

### Logs
- Session dir: `logs/emcap/<timestamp>/` (or flat `logs/emcap/` if timestamp failed earlier)
- Files: `run.log`, `pytest.log`, `web-build.log`, `web-test.log`, `docker.log`, `web.log`, `docker-start.log`
- Pointer: `logs/emcap/latest.txt`

---

## Errors encountered → fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `emcap-env.bat` not recognized (no `scripts\`) | `%~dp0` empty from PowerShell | `_resolve-scripts.bat`; run from repo root |
| Batch window closes | No `pause` | `pause` at end; docker log tail keeps window open |
| Web not starting | Failed before web step OR bad `start` | `--stack-only`; PowerShell web window + `run-web-with-logs.ps1` |
| CI invalid workflow YAML | `sqlite:///:memory:` trailing `:` | Quote in `.github/workflows/ci.yml` |
| pytest 2 customers | Demo seed on test config | `platform-test.yaml` |
| `[stack] FAILED` | `docker` not on PATH | Install/start Docker Desktop |
| `ruff` not recognized | Dev dep not on PATH | `python -m ruff` + `_ensure-python-dev.bat` |
| Stack failed but script OK | Stale `errorlevel` | `set ERR=!errorlevel!` after nested `call` |
| `ECHO is off` | Empty `:log ""` | Skip empty log lines |

---

## Verification status (user machine / session)

| Step | Status |
|------|--------|
| lint-format (ruff/black/mypy/web) | **Passed** after `python -m` fix |
| pytest | **72 passed** (in run.log) |
| Karma | **8/8 passed** |
| Docker stack | **Failed** — `docker` not recognized |
| Flutter | Skipped (no SDK) |
| Git commit | **Not done** — user review pending |

---

## Docs / backlog updated

- `plan/11-local-dev-tooling.md` — playbook
- `plan/03-task-backlog.md` — **Phase 11** EMCAP-P11-T01–T12 Done → **143/143**
- `docs/dev/known-pitfalls.md` — Phase 11 section
- `docs/dev/recipes/run-emcap-local-stack.md`
- `docs/dev/codebase-index.md`, README, production-readiness
- `spec/sdd/00-document-control.md` (1.4), `03-traceability-matrix.md`
- Skills: `emcap-devops`, `emcap-codebase-map`, `emcap-testing`
- `plan/00-session-summary.md`

Prior memos:
- `2026-06-11-emcap-phase8-docs-sync.md`
- `2026-06-11-emcap-angular-cli-docs-sync.md`
- `2026-06-11-emcap-run-emcap-seed-data.md`
- `2026-06-12-emcap-phase11-docs-pitfalls.md`

---

## User next steps

1. Install/start **Docker Desktop**; verify `docker --version`
2. From repo root: `scripts\run-emcap.bat --stack-only`
3. Review diff → commit when ready
4. Optional: production sign-off in `docs/ops/production-readiness.md`

## Key commands

```bat
cd C:\Users\u1074139\workstation\Study\SDD
scripts\lint-format.bat
scripts\run-emcap.bat --stack-only
scripts\stop-emcap.bat
```

Login: `admin` / `admin123` · Web http://localhost:4200 · API http://localhost:8000/api/v1/health
