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
4. `spec/sdd/05-end-user-matrix.md` — end-user UX status (Phase 8)
5. `spec/sdd/04-capability-matrix.md` — platform service status (Phase 7)
6. `plan/07-phase8-end-user-product.md` — end-user UX playbook
7. `plan/03-task-backlog.md` — task status (131/131 Done)
8. `spec/sdd/03-traceability-matrix.md` — requirement IDs

## Quick zones

| Task type | Go to |
|-----------|-------|
| New platform endpoint | `platform/api/src/emcap/api/routes/` + recipe `add-platform-route.md` |
| New client method | `clients/web/src/api/emcap-client.ts` + `add-client-api-method.md` |
| Entity UX (web) | `clients/web/src/app/entity-view.ts` + `add-record-edit-ui.md` |
| Entity UX (mobile) | `clients/mobile/lib/app/entity_screen.dart` |
| New business module | `modules/<name>/module.py` + `add-business-module.md` |
| Report UI | `add-report-ui.md` |
| Reference modules | `modules/inventory/module.py`, `modules/crm/module.py` |
| SaaS / white-label | `docs/dev/saas-shell.md`, `clients/mobile/lib/theme.dart` |

## Verify

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run lint; npm test
cd clients/mobile; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
```

**Current gates:** 60 pytest · 8 vitest · 3 flutter · backend ~90% (CI gate 80%).

## External recall

Out-of-repo summaries are indexed in `docs/dev/recall-index.md` — prefer in-repo docs.
