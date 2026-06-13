# Phase 11 docs + pitfalls sync

## Goal
Document all error fixes from run-emcap, seed, lint, CI sessions; add Phase 11 tasks to backlog.

## Errors learned → documented

| Error | Fix | Doc |
|-------|-----|-----|
| `emcap-env.bat` not recognized (no `scripts\`) | `_resolve-scripts.bat`, run from repo root | pitfalls Phase 11 |
| Batch window closes | `pause`, docker log tail | recipe run-emcap |
| Web not starting | PowerShell `run-web-with-logs.ps1`, stack-only flag | recipe |
| `sqlite:///:memory:` YAML invalid | Quote in ci.yml | pitfalls |
| Demo seed breaks pytest | `platform-test.yaml` | pitfalls + test_seed_loader |
| `errorlevel` after nested call | `set ERR=!errorlevel!` | pitfalls |
| `ECHO is off` | Skip empty `:log` | pitfalls |
| Log dir no timestamp | Fix PowerShell date in for /f | pitfalls |
| verify-full-stack lint | lint-format first | pitfalls |

## What changed
- `plan/11-local-dev-tooling.md`, `plan/03-task-backlog.md` (P11-T01–T12, 143 total)
- `docs/dev/known-pitfalls.md` Phase 11 section
- `docs/dev/recipes/run-emcap-local-stack.md`
- `docs/dev/codebase-index.md`, README, production-readiness
- Skills: emcap-devops, emcap-codebase-map, emcap-testing
- `spec/sdd/00-document-control.md`, `03-traceability-matrix.md`
- `plan/00-session-summary.md`

## Verification
- Docs only; user runs `scripts\run-emcap.bat --stack-only` locally

## Open
- User review before commit
