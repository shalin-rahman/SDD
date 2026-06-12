# Phase 10 — Angular CLI web client

Migrates `clients/web` from archived Vite shell (`clients/web-legacy/`) to **Angular CLI 19** per SDD §9 and ADR-005.

**Status:** Complete — 2026-06-11

## Delivered

| Item | Path |
|------|------|
| Angular CLI app | `clients/web/` |
| Archived Vite shell | `clients/web-legacy/` |
| ADR | `spec/sdd/adrs/005-angular-cli-web-client.md` |
| Routes | login → shell → workflow, reports, dashboards, notifications, account, assistant, `entity/:code` |
| Contract tests | Karma: `emcap-client.spec.ts`, `dynamic-form.renderer.spec.ts` |

## Scaffold (if rebuilding)

```powershell
# Ensure npm global cache path exists (Windows)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\npm"

cd clients
Rename-Item web web-legacy   # if replacing
npx -y @angular/cli@19 new web --routing --style=scss --ssr=false --standalone --skip-git --defaults
cd web
npm install                  # if ng new failed mid-install
```

Then port `web-legacy/src/` into `web/src/app/` (API, metadata renderers, pages).

## TypeScript config

Set in `clients/web/tsconfig.json`:

```json
"noPropertyAccessFromIndexSignature": false
```

Required when using `Record<string, unknown>` for API payloads (avoids TS4111 across templates and components).

## Verify

```powershell
cd clients/web
npm ci
npm run build
npm run test:ci
npm start
```

## CI

`.github/workflows/ci.yml` → `client-lint-web`: `npm run build` + `npm run test:ci` with `browser-actions/setup-chrome`.
