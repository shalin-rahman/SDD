# Recipe — Angular CLI web client

SDD §9 web stack. Canonical path: `clients/web/`.

## Fresh scaffold (disaster recovery)

```powershell
# Windows: fix npm global path if npx fails
New-Item -ItemType Directory -Force -Path "$env:APPDATA\npm"

cd clients
Rename-Item web web-legacy-backup -ErrorAction SilentlyContinue
npx -y @angular/cli@19 new web --routing --style=scss --ssr=false --standalone --skip-git --defaults
cd web
npm install
```

If `ng new` errors mid-flight, run `npm install` then `npm run build`.

## TypeScript config (required)

In `clients/web/tsconfig.json`:

```json
"noPropertyAccessFromIndexSignature": false
```

Avoids TS4111 when using `Record<string, unknown>` API payloads.

## Port from legacy

Copy and adapt from `clients/web-legacy/src/`:

| Legacy | Angular |
|--------|---------|
| `api/emcap-client.ts` | `src/app/api/emcap-client.ts` |
| `metadata/contract.ts` | `src/app/metadata/contract.ts` |
| `dynamic-form.component.ts` | `src/app/metadata/dynamic-form.renderer.ts` |
| `dynamic-grid.component.ts` | `src/app/metadata/dynamic-grid.renderer.ts` |
| `app/main.ts` + `entity-view.ts` | `src/app/pages/*` components + `app.routes.ts` |

## Verify

```powershell
cd clients/web
npm run build
npm run test:ci
npm start
```

## CI

`.github/workflows/ci.yml` → `browser-actions/setup-chrome` + `npm run build` + `npm run test:ci`.
