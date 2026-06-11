---
name: emcap-codebase-map
description: >-
  EMCAP in-repo codebase index, known pitfalls, and implementation recipes.
  Use at the start of any task to avoid re-exploring the monorepo — read index
  and pitfalls before searching files.
---

# EMCAP Codebase Map

## Read first (in order)

1. `docs/dev/codebase-index.md` — file → purpose lookup
2. `docs/dev/known-pitfalls.md` — errors already fixed; do not reintroduce
3. `docs/dev/recipes/<task>.md` — step-by-step implementation
4. `spec/sdd/04-capability-matrix.md` — Partial/No gaps (Phase 7)
5. `plan/06-sdd-gap-closure.md` — current executable playbook
6. `plan/03-task-backlog.md` — task status
7. `spec/sdd/03-traceability-matrix.md` — requirement IDs

## Quick zones

| Task type | Go to |
|-----------|-------|
| New platform endpoint | `platform/api/src/emcap/api/routes/` + recipe `add-platform-route.md` |
| New client method | `clients/web/src/api/emcap-client.ts` + `add-client-api-method.md` |
| New business module | `modules/<name>/module.py` + `add-business-module.md` |
| Report UI | `add-report-ui.md` |
| Inventory reference | `modules/inventory/module.py` |

## Verify

```powershell
cd platform/api; python -m pytest -q
cd clients/web; npm run lint; npm test
.\scripts\verify-full-stack.ps1
```

## External recall

Out-of-repo summaries are indexed in `docs/dev/recall-index.md` — prefer in-repo docs.
