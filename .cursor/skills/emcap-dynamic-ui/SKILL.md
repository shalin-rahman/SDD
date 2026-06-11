---
name: emcap-dynamic-ui
description: >-
  EMCAP dynamic form and grid metadata contract shared by Vite/TypeScript web,
  Flutter mobile, and backend API. Use when building metadata-driven UI renderers
  or metadata endpoints.
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

**Not yet in renderers:** layout grid row/col/span (future).

## Backend builder

`emcap.metadata.builder.build_form_metadata()` / `build_grid_metadata()`

Path: `platform/api/src/emcap/metadata/builder.py`

Generated from `EntityDefinition` + `config/platform.yaml` grid settings.

## Client layout (SDD §9)

### Web (`clients/web/`)

| Path | Role |
|------|------|
| `src/api/emcap-client.ts` | HTTP client: 40+ methods |
| `src/app/main.ts` | Login, nav, workflow inbox, reports, account, AI |
| `src/app/entity-view.ts` | Edit/delete/search/pagination/export/workflow start |
| `src/metadata/contract.ts` | Form/grid types, i18n, validators |
| `src/dynamic-form.component.ts` | Field types, validation, conditions |
| `src/dynamic-grid.component.ts` | Sort, filter, group, export |
| `index.html` | Shell host; `window.EMCAP_API_URL` |

### Mobile (`clients/mobile/`)

| Path | Role |
|------|------|
| `lib/api/emcap_client.dart` | HTTP client parity with web |
| `lib/app/shell.dart` | Login (OAuth), tenant picker, nav rail |
| `lib/app/entity_screen.dart` | Full entity UX parity with `entity-view.ts` |
| `lib/theme.dart` | White-label `ThemeData` (avoid `main.dart` ↔ `shell.dart` import) |
| `lib/metadata_contract.dart` | Form/grid validators + render helpers |
| `lib/main.dart` | Entry; `--dart-define=EMCAP_API_URL=` |

## Renderer features (Phase 8)

| Feature | Web | Mobile |
|---------|-----|--------|
| Edit / delete record | `entity-view.ts` | `entity_screen.dart` |
| Search + pagination | both entity views | both |
| Form validation + conditions | `dynamic-form.component.ts` | `metadata_contract.dart` |
| i18n labels | `contract.ts` helpers | `metadata_contract.dart` |
| Grid sort/filter/group/export | `dynamic-grid.component.ts` | `metadata_contract.dart` |
| Document preview | `getDocument()` in record detail | same |
| Workflow start from record | `startWorkflow()` | same |

## API client layer

Full endpoint mapping: `plan/04-client-api-completion.md`

All client requests send `Authorization: Bearer` and `X-Tenant-ID` after login. Browser dev requires API CORS (`emcap/main.py`).

## Contract tests

| Layer | Path |
|-------|------|
| API | `tests/test_metadata_workflow.py::test_metadata_contract_keys` |
| API gaps | `tests/test_client_api_gaps.py` |
| Web | `src/dynamic-form.component.test.ts`, `src/dynamic-grid.component.test.ts` |
| Mobile | `test/metadata_contract_test.dart` |
| Fixtures | `tests/fixtures/metadata/` |
