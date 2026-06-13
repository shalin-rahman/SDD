# EMCAP run-emcap.bat + JSON seed data

## Goal
Batch runner: all tests → stop existing services → Docker stack by dependency → seed → web client. Production-grade core seed + configurable demo seed from JSON.

## Decisions
- Seed packs: `data/seed/core/` (roles, users), `data/seed/demo/` (entity records with stable IDs).
- Config: `config/platform.yaml` → `seed.core` / `seed.demo`; demo purge when `demo.enabled: false` + `remove_when_disabled: true`.
- Tests use `config/platform-test.yaml` (demo seed off).
- Platform loader: `emcap/seed/loader.py`, invoked from `create_app()` and `scripts/apply-seed.py`.

## What changed
- `scripts/run-emcap.bat`, `scripts/stop-emcap.bat`, `scripts/apply-seed.py`
- `data/seed/**` JSON + README
- `platform/api/src/emcap/seed/`, config models, `main.py`
- `config/platform.yaml`, `config/platform-test.yaml`
- `infra/docker/docker-compose.yml`, `Dockerfile` (mount/copy `data/`)
- `platform/api/tests/test_seed_loader.py`, `conftest.py`
- `scripts/verify-full-stack.ps1` (build + test:ci)

## Verification
- `python -m pytest -q --cov=src --cov-fail-under=80` → 71 passed

## Open follow-ups
- Run `scripts\run-emcap.bat` end-to-end (needs Docker, npm, Chrome for Karma in bat).
- User review before commit.
