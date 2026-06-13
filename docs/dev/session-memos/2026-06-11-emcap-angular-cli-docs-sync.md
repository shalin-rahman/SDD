# EMCAP Angular CLI — docs/skills sync

## Goal

Update docs, skills, CI, and pitfalls after Phase 10 Angular CLI migration; capture errors from migration.

## Migration errors learned

| Error | Resolution |
|-------|------------|
| `%APPDATA%\npm` ENOENT | Create folder before `npx ng new` |
| `readable-stream` during `ng new` | `npm install` after partial scaffold |
| TS4111 index signature | `noPropertyAccessFromIndexSignature: false` in `tsconfig.json` |
| CI `npm run lint` missing | Switch to `npm run build` + `npm run test:ci` |
| Karma hang | `--watch=false --browsers=ChromeHeadless` + setup-chrome in CI |

## What changed

- `clients/web/` — Angular CLI 19 (canonical)
- `clients/web-legacy/` — archived Vite shell
- ADR-005, `plan/10-angular-cli-web.md`
- CI: `browser-actions/setup-chrome`, build + test:ci
- Skills: architecture, dynamic-ui, devops, testing, codebase-map
- Rules: `frontend-angular.mdc`
- Docs: README, codebase-index, known-pitfalls, recipe `angular-cli-scaffold.md`
- ADR-004 note: Angular deferred → completed in ADR-005

## Verify

```powershell
cd clients/web; npm run build; npm run test:ci
```
