---
name: emcap-codebase-map
description: >-
  EMCAP in-repo codebase index, known pitfalls, and implementation recipes.
  Use before broad file search — read index, recipes, and pitfalls before searching files.
---

# EMCAP codebase map

## Read first (in order)

1. `docs/dev/codebase-index.md` — zones, scripts, tests
2. `docs/dev/known-pitfalls.md` — Phase 11 batch/CI/seed regressions
3. `docs/dev/recipes/` — task-specific how-tos

## Local dev (Phase 11)

| Doc | When |
|-----|------|
| `plan/11-local-dev-tooling.md` | run-emcap, seed, lint gates |
| `docs/dev/recipes/run-emcap-local-stack.md` | Start stack on Windows |
| `data/seed/README.md` | JSON seed format |

**Run from repo root:** `scripts\run-emcap.bat`

## Phase highlights

| Phase | Playbook |
|-------|----------|
| 10 | `plan/10-angular-cli-web.md` — Angular CLI web |
| 9 | `plan/08-sdd-100-closure.md` |
| 8 | `plan/07-phase8-end-user-product.md` |
| Backlog | `plan/03-task-backlog.md` (143 tasks) |

## Canonical web paths

Edit `clients/web/src/app/` only — not `clients/web-legacy/`.

## Test config

Pytest uses `config/platform-test.yaml` (demo seed disabled). Production/local stack uses `config/platform.yaml`.
