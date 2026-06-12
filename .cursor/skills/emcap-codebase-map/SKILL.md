---
name: emcap-codebase-map
description: >-
  EMCAP in-repo codebase index, known pitfalls, and implementation recipes.
  Use at the start of any task to avoid re-exploring the monorepo — read index
  and pitfalls before searching files.
---

# EMCAP Codebase Map

## Read first

1. `docs/dev/codebase-index.md`
2. `docs/dev/known-pitfalls.md` — includes Angular migration pitfalls
3. `plan/10-angular-cli-web.md` — web client stack
4. `spec/sdd/05-end-user-matrix.md`
5. `plan/03-task-backlog.md`

## Web client zones

| Task | Path |
|------|------|
| Angular pages | `clients/web/src/app/pages/` |
| API client | `clients/web/src/app/api/emcap-client.ts` |
| Metadata renderers | `clients/web/src/app/metadata/` |
| Routes | `clients/web/src/app/app.routes.ts` |
| Archived Vite | `clients/web-legacy/` (read-only) |

## Verify

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run build; npm run test:ci
cd clients/mobile; flutter test
```
