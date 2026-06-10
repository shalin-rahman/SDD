---
name: emcap-dynamic-ui
description: >-
  EMCAP dynamic form and grid metadata contract shared by Angular, Flutter, and
  backend API. Use when building metadata-driven UI renderers or metadata endpoints.
---

# EMCAP Dynamic UI

## Metadata contract

| Type | Endpoint | Client path |
|------|----------|-------------|
| Form | `GET /api/v1/metadata/forms/{entity}` | `clients/web/src/metadata/contract.ts`, `clients/mobile/lib/metadata_contract.dart` |
| Grid | `GET /api/v1/metadata/grids/{entity}` | same |

## Required keys

**Form:** `schema_version`, `entity_code`, `sections`, `conditions`, `i18n`

**Grid:** `schema_version`, `entity_code`, `columns`, `export`, `grouping`, `realtime`, `offline`, `i18n`

## Backend builder

`emcap.metadata.builder.build_form_metadata()` / `build_grid_metadata()`

Generated from `EntityDefinition` + `config/platform.yaml` grid settings.

## Client layout (SDD §9)

### Web (`clients/web/`)

| Path | Role |
|------|------|
| `src/api/emcap-client.ts` | HTTP client: auth, menus, CRUD, sync, notes, workflows |
| `src/app/main.ts` | Login → menus → entity grid/form shell |
| `src/metadata/contract.ts` | Form/grid types + validators |
| `src/dynamic-form.component.ts` | Form field renderer |
| `src/dynamic-grid.component.ts` | Grid column renderer |
| `index.html` | Shell host; `window.EMCAP_API_URL` |

### Mobile (`clients/mobile/`)

| Path | Role |
|------|------|
| `lib/api/emcap_client.dart` | HTTP client: auth, menus, CRUD, sync, notes, workflows |
| `lib/app/shell.dart` | Login + NavigationRail |
| `lib/app/entity_screen.dart` | Metadata grid + create form |
| `lib/metadata_contract.dart` | Form/grid validators + render helpers |
| `lib/main.dart` | Entry; `--dart-define=EMCAP_API_URL=` |

## API client layer

Platform endpoints used by presentation shells (see `plan/04-client-api-completion.md` for full mapping):

| Concern | Endpoint | Web method | Mobile method |
|---------|----------|------------|---------------|
| Auth | `POST /api/v1/auth/login` | `login()` | `login()` |
| Menus | `GET /api/v1/menus` | `getMenus()` | `getMenus()` |
| Form metadata | `GET /api/v1/metadata/forms/{entity}` | `getFormMetadata()` | `getFormMetadata()` |
| Grid metadata | `GET /api/v1/metadata/grids/{entity}` | `getGridMetadata()` | `getGridMetadata()` |
| Records | `GET/POST /api/v1/entities/{entity}/records` | `listRecords()`, `createRecord()` | same |
| Offline sync | `GET /api/v1/sync/{entity}/snapshot` | `syncSnapshot()` | `syncSnapshot()` |
| Notes | `GET/POST .../records/{id}/notes` | `listNotes()`, `addNote()` | `listNotes()`, `addNote()` |
| Workflows | `GET /api/v1/workflows/instances` | `listWorkflowInstances(recordId?)` | `listWorkflowInstances({recordId})` |

Additional platform APIs (documents list, sync changes, SSE stream, reports) are documented in `plan/04-client-api-completion.md`; wire new UI against those routes without changing the metadata contract.

All client requests send `Authorization: Bearer` and `X-Tenant-ID` after login. Browser dev requires API CORS (`emcap/main.py`).

## Client renderers

- Web: `DynamicFormRenderer`, `DynamicGridRenderer` in `clients/web/src/dynamic-*.component.ts`
- Flutter: `DynamicFormRenderer`, `DynamicGridRenderer` in `clients/mobile/lib/metadata_contract.dart`

## Contract tests

`tests/test_metadata_workflow.py::test_metadata_contract_keys`

Client/API gap tests: `tests/test_client_api_gaps.py`

Fixtures: `tests/fixtures/metadata/`
