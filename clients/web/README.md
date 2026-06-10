# EMCAP web thin client

Metadata-driven presentation shell aligned with **SDD §9 Dynamic UI Platform**. The Vite/TypeScript client consumes the same backend form/grid metadata contract as the Flutter mobile client (`src/metadata/contract.ts` mirrors `clients/mobile/lib/metadata_contract.dart`).

## SDD §9 structure

| Layer | Path | Role |
|-------|------|------|
| **API client layer** | `src/api/emcap-client.ts` | `fetch` wrapper with Bearer auth and `X-Tenant-ID`; login, menus, metadata, CRUD, sync snapshot, notes, workflow list |
| **Metadata contract** | `src/metadata/contract.ts` | Shared form/grid types, validators, optional i18n keys |
| **Dynamic renderers** | `src/dynamic-form.component.ts`, `src/dynamic-grid.component.ts` | Field names, required flags, column/export helpers from metadata |
| **Thin shell app** | `src/app/main.ts` | Login → menu navigation → entity grid + create form + sync version label + optional note on create |
| **Host** | `index.html` | Mount point `#app`, base styles, `window.EMCAP_API_URL` |

```
index.html
src/api/emcap-client.ts
src/metadata/contract.ts
src/dynamic-form.component.ts
src/dynamic-grid.component.ts
src/app/main.ts
```

## Capabilities

| SDD capability | Implementation |
|----------------|----------------|
| Dynamic forms | Create form fields from `GET /api/v1/metadata/forms/{entity}` |
| Dynamic grid | Table columns from `GET /api/v1/metadata/grids/{entity}` |
| Offline sync snapshot | Displays `sync_version` from `GET /api/v1/sync/{entity}/snapshot` |
| Auth + tenant | Login → Bearer token + `X-Tenant-ID` on all requests |
| Menu navigation | Top nav from `GET /api/v1/menus` |
| Entity CRUD | `listRecords`, `getRecord`, `createRecord`, `updateRecord`, `deleteRecord` |
| Notes | `listNotes` / `addNote` (optional note on create in shell) |
| Workflow list | `listWorkflowInstances(recordId?)` (API client ready for task/inbox views) |

Future Angular/React production shells share the same metadata endpoints; this project is the minimal TypeScript presentation slice only.

## How to run

**Prerequisites:** Node.js 20+, npm, EMCAP API at `http://localhost:8000` (e.g. `docker compose up` from `infra/docker`, or local uvicorn).

```bash
cd clients/web
npm ci
npm run dev
```

Open **http://localhost:4200** (Vite dev server, port 4200).

Default API base: **http://localhost:8000** — set `window.EMCAP_API_URL` in `index.html` or pass a URL to `createClient()`.

Default login scaffold credentials: `admin` / `admin123`.

The API must allow **CORS** for browser cross-origin requests during local dev.

## Quality checks

```bash
cd clients/web
npm ci
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

ESLint config: `eslint.config.mjs` (`typescript-eslint` recommended rules).

Contract test: `src/api/emcap-client.test.ts` verifies SDD §9 client method surface.

## API client surface

| Method | Endpoint |
|--------|----------|
| `login()` | `POST /api/v1/auth/login` |
| `getMenus()` | `GET /api/v1/menus` |
| `getFormMetadata()` | `GET /api/v1/metadata/forms/{entity}` |
| `getGridMetadata()` | `GET /api/v1/metadata/grids/{entity}` |
| `listRecords()` | `GET /api/v1/entities/{entity}/records` |
| `getRecord()` | `GET /api/v1/entities/{entity}/records/{id}` |
| `createRecord()` | `POST /api/v1/entities/{entity}/records` |
| `updateRecord()` | `PUT /api/v1/entities/{entity}/records/{id}` |
| `deleteRecord()` | `DELETE /api/v1/entities/{entity}/records/{id}` |
| `syncSnapshot()` | `GET /api/v1/sync/{entity}/snapshot` |
| `listNotes()` / `addNote()` | `GET/POST .../records/{id}/notes` |
| `listWorkflowInstances()` | `GET /api/v1/workflows/instances` |

See `plan/04-client-api-completion.md` for platform API additions and mobile parity notes.
