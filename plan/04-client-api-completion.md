# Client & API completion — SDD §9 / §30

Extends the platform after Phase 5 with **client-consumable platform APIs** and **thin presentation shells** in `clients/web` and `clients/mobile`. Business modules still register only via `ModuleDefinition` under `modules/`; these changes extend platform services and presentation clients per SDD layering.

**Verification:** `platform/api/tests/test_client_api_gaps.py` · **Plan trace:** post–Phase 5 client slice

---

## API gaps filled (platform layer)

Gaps identified during client integration — generic platform routes, not inventory-specific handlers.

| Gap | Endpoint(s) | Platform implementation | Purpose |
|-----|-------------|-------------------------|---------|
| **Notes** | `GET/POST /api/v1/entities/{entity}/records/{id}/notes` | `emcap/api/routes/notes.py`, `emcap/notes/service.py` | Record-level notes when `EntityOptions.notes_enabled` (Inventory: `PRODUCT`, `WAREHOUSE`) |
| **Documents list** | `GET /api/v1/documents?entity_code=&record_id=` | `emcap/api/routes/documents.py` (`list_documents`) | Attachment lists per record (upload already existed) |
| **Workflow instances GET** | `GET /api/v1/workflows/instances`, `GET /api/v1/workflows/instances/{id}` | `emcap/api/routes/workflows.py` | Inbox / task views; optional `record_id` filter |
| **Offline sync** | `GET /api/v1/sync/{entity}/snapshot`, `GET /api/v1/sync/{entity}/changes?since=` | `emcap/api/routes/sync.py`, `emcap/sync/service.py` | Mobile offline cache: metadata + records bundle; incremental changes |
| **SSE realtime** | `GET /api/v1/entities/{entity}/records/stream` | `emcap/api/routes/realtime.py` | Server-Sent Events heartbeat for live grid refresh (`grid.realtime` flag in metadata) |
| **LOW_STOCK filter** | `POST /api/v1/reports/LOW_STOCK/run` | Report engine + Inventory module definition | Returns only rows where `quantity_on_hand < reorder_level` |
| **CORS** | All `/api/v1/*` | `CORSMiddleware` in `emcap/main.py` (`allow_origins=["*"]`, all methods/headers) | Browser clients (`clients/web`, Flutter web) can call API from another origin during local dev |

### Notes

- Notes are gated by entity metadata; Inventory enables them without editing platform core.
- Sync snapshot payload includes `entity_code`, `sync_version`, `form_metadata`, `grid_metadata`, and `records`.
- Sync `changes` accepts ISO-8601 `since` and returns `{ count, changes[] }`.
- LOW_STOCK run body is optional; filter logic lives in the report engine (`emcap/reporting/service.py`) and Inventory report definition — verified by `test_low_stock_report_filter`.
- CORS is configured at app startup (not a dedicated pytest); verify by loading the web shell at `:4200` against API at `:8000` or `OPTIONS` preflight from browser devtools.

---

## Web shell architecture (SDD §9 presentation layer)

SDD §9 defines a **metadata-driven presentation layer**: one backend form/grid contract drives renderers. The web client is a **Vite + TypeScript thin shell** (Angular-style renderer classes, no full Angular framework in this scaffold).

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation (clients/web)                                  │
│  index.html → window.EMCAP_API_URL                           │
│  src/app/main.ts          login → menus → entity views       │
│  dynamic-form/grid.component.ts  metadata field/column helpers│
│  src/metadata/contract.ts  types + validateForm/GridMetadata │
│  src/api/emcap-client.ts   HTTP, auth, tenant header         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + Bearer + X-Tenant-ID
┌──────────────────────────▼──────────────────────────────────┐
│  Application / Platform API (platform/api)                     │
│  /auth/login · /menus · /metadata/* · /entities/* · /sync/*  │
└─────────────────────────────────────────────────────────────┘
```

### File roles

| Path | Layer | Responsibility |
|------|-------|----------------|
| `clients/web/index.html` | Shell host | Root `#app`, inline styles, `EMCAP_API_URL` |
| `clients/web/src/app/main.ts` | Application UI | Login form → shell (header, nav) → entity grid + create form |
| `clients/web/src/api/emcap-client.ts` | API client | `fetch` wrapper, token/tenant, platform endpoints |
| `clients/web/src/metadata/contract.ts` | Contract | Form/grid types, required keys, validators |
| `clients/web/src/dynamic-form.component.ts` | Renderer | Field names and required flags from form metadata |
| `clients/web/src/dynamic-grid.component.ts` | Renderer | Column fields from grid metadata |

### Entity view flow

1. **Login** — `POST /api/v1/auth/login` → store `access_token`, `tenant_id`.
2. **Menus** — `GET /api/v1/menus` → nav buttons per module entity.
3. **Entity screen** — parallel fetch: form metadata, grid metadata, records, sync snapshot.
4. **Validate** — `validateFormMetadata` / `validateGridMetadata` (contract test parity).
5. **Render** — dynamic grid table + dynamic create form; optional note on create via notes API.
6. **Offline hint** — display `sync_version` from snapshot (SDD grid `offline` flag support).

Default dev URL: `http://localhost:4200` (Vite). API default: `http://localhost:8000`.

---

## Mobile shell architecture

Same SDD §9 contract as web, implemented as a **Flutter Material 3** shell. Shared semantics with `clients/web/src/metadata/contract.ts` live in `lib/metadata_contract.dart`.

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation (clients/mobile)                               │
│  lib/main.dart              EMCAP_API_URL dart-define        │
│  lib/app/shell.dart         LoginScreen → EmcapShell         │
│  lib/app/entity_screen.dart FutureBuilder grid + form        │
│  lib/metadata_contract.dart FormMetadata, GridMetadata,      │
│                               DynamicForm/GridRenderer       │
│  lib/api/emcap_client.dart  http client, auth, tenant        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Platform API (same as web)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Navigation model

- **LoginScreen** — username/password → `setToken` → push `EmcapShell`.
- **EmcapShell** — `NavigationRail` built from `/api/v1/menus`; selected item drives `EntityScreen`.
- **EntityScreen** — loads metadata + records + sync snapshot; `DataTable` + `TextFormField` list from renderers; create record refreshes view.

### Platform targets

| Target | API base URL |
|--------|----------------|
| Desktop / iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical device | Host machine LAN IP |
| Flutter web (Chrome) | `http://localhost:8000` (requires API CORS) |

---

## API-to-client mapping

| API endpoint | Web (`emcap-client.ts`) | Mobile (`emcap_client.dart`) | Used in shell UI |
|--------------|-------------------------|------------------------------|------------------|
| `POST /api/v1/auth/login` | `login()` | `login()` | Login screens |
| `GET /api/v1/menus` | `getMenus()` | `getMenus()` | Nav / NavigationRail |
| `GET /api/v1/metadata/forms/{entity}` | `getFormMetadata()` | `getFormMetadata()` | Create forms |
| `GET /api/v1/metadata/grids/{entity}` | `getGridMetadata()` | `getGridMetadata()` | Grid columns |
| `GET /api/v1/entities/{entity}/records` | `listRecords()` | `listRecords()` | Entity grid |
| `POST /api/v1/entities/{entity}/records` | `createRecord()` | `createRecord()` | Create form submit |
| `GET /api/v1/sync/{entity}/snapshot` | `syncSnapshot()` | `syncSnapshot()` | Offline version label |
| `GET /api/v1/sync/{entity}/changes?since=` | `syncChanges()` | `syncChanges()` | Entity view offline delta count |
| `GET /api/v1/entities/{entity}/records/{id}/notes` | `listNotes()` | `listNotes()` | Record detail panel |
| `POST /api/v1/entities/{entity}/records/{id}/notes` | `addNote()` | `addNote()` | Create form optional note |
| `GET /api/v1/workflows/instances` | `listWorkflowInstances(recordId?)` | `listWorkflowInstances({recordId})` | Workflow tasks inbox |
| `POST /api/v1/workflows/instances/{id}/transition` | `transitionWorkflow()` | `transitionWorkflow()` | Inbox Submit / Approve / Reject |
| `POST /api/v1/workflows/instances/{id}/delegate` | `delegateWorkflow()` | `delegateWorkflow()` | Inbox delegate action |
| `GET /api/v1/workflows/instances/{id}` | — | — | API only |
| `GET /api/v1/documents?entity_code=&record_id=` | `listDocuments()` | `listDocuments()` | Record detail panel |
| `POST /api/v1/documents/upload` | `uploadDocument()` | `uploadDocument()` | Record detail upload form |
| `GET /api/v1/entities/{entity}/audit` | `listAudit()` | `listAudit()` | Record detail audit table |
| `GET /api/v1/entities/{entity}/records/stream` | `subscribeRecordsStream()` | `subscribeRecordsStream()` | Grid refresh on SSE heartbeat |
| `GET /api/v1/notifications` | `listNotifications()` | `listNotifications()` | Notifications view |
| `POST /api/v1/notifications/send` | `sendNotification()` | `sendNotification()` | Notifications send form |
| `GET /api/v1/auth/permissions` | `getPermissions()` | `getPermissions()` | Account view |
| `GET /api/v1/auth/roles` | `getRoles()` | `getRoles()` | Account view |
| `GET /api/v1/dashboards` | `listDashboards()` | `listDashboards()` | Dashboards view |
| `GET /api/v1/health` | `getHealth()` | `getHealth()` | Header tenant mode line |
| `GET /api/v1/config/platform` | `getPlatformConfig()` | `getPlatformConfig()` | Account — payments flag |
| `GET /api/v1/tenants` | `listTenants()` | `listTenants()` | Account — white-label flag |
| `POST /api/v1/payments/intents` | `createPaymentIntent()` | `createPaymentIntent()` | Account demo (when enabled) |
| `POST /api/v1/integrations/rest/dispatch` | `dispatchRestIntegration()` | `dispatchRestIntegration()` | Client API; Account lists route |
| `GET /api/v1/reports` | `listReports()` | `listReports()` | Reports nav — list codes |
| `POST /api/v1/reports/{code}/run` | `runReport(code)` | `runReport(code)` | Reports nav — run LOW_STOCK etc. |
| CORS (`OPTIONS` + cross-origin `GET/POST`) | Browser automatic | Flutter web | `CORSMiddleware` in `emcap/main.py` |

**Parity note:** Web and mobile shells wire workflow actions, notifications, dashboards, Account (permissions/roles/integrations/payments), record detail (notes, documents, upload, audit), Reports, and offline sync delta count. Both subscribe to SSE for grid refresh when `grid.realtime` is enabled. Web additionally exports CSV when `grid.export.csv` is set in metadata.

---

## How to run full stack locally

### 1. Start platform API + dependencies

**Docker (recommended):**

```bash
cd infra/docker
docker compose up --build
```

- API health: http://localhost:8000/api/v1/health  
- Postgres: `localhost:5432` · Redis: `6379` · MinIO: `9000`

**Local Python (no Docker):**

```bash
cd platform/api
pip install -e ".[dev]"
# Windows
set EMCAP_CONFIG_PATH=../../config/platform.yaml
set EMCAP_MODULES_PATH=../../modules
# Linux/macOS
export EMCAP_CONFIG_PATH=../../config/platform.yaml
export EMCAP_MODULES_PATH=../../modules
uvicorn emcap.main:app --reload --app-dir src --host 0.0.0.0 --port 8000
```

### 2. Verify API gaps (optional)

```bash
cd platform/api
pytest -q tests/test_client_api_gaps.py tests/test_inventory_e2e.py
```

### 3. Start web client

```bash
cd clients/web
npm ci
npm run dev
```

Open http://localhost:4200 — default credentials `admin` / `admin123`.  
Ensure `index.html` sets `window.EMCAP_API_URL = "http://localhost:8000"` (default).

### 4. Start mobile client

```bash
cd clients/mobile
flutter pub get
flutter run --dart-define=EMCAP_API_URL=http://localhost:8000
# Android emulator:
flutter run --dart-define=EMCAP_API_URL=http://10.0.2.2:8000
```

### Full-stack smoke test

1. API health returns `200`.
2. Web login → Inventory menus (Products, Warehouses) → grid loads from metadata.
3. Create a product with optional note → record appears; note via `addNote` on web.
4. Mobile login → same menus → grid and create form from shared metadata contract.
5. `pytest tests/test_client_api_gaps.py` green.

---

## Architecture constraints

- Business modules remain under `modules/` only; Inventory does not add client-specific routes.
- Platform extensions (notes, sync, realtime, documents list, workflow GET, CORS) are generic services consumed by any module with the appropriate entity/report flags.
- Metadata contract keys remain the cross-renderer source of truth; see `.cursor/skills/emcap-dynamic-ui/SKILL.md`.

---

## Related documents

| Document | Path |
|----------|------|
| Session summary | `plan/00-session-summary.md` |
| Inventory DoD | `docs/modules/inventory-definition-of-done.md` |
| Web client README | `clients/web/README.md` |
| Mobile client README | `clients/mobile/README.md` |
| Traceability | `spec/sdd/03-traceability-matrix.md` |
