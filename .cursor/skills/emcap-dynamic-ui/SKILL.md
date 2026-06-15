---
name: emcap-dynamic-ui
description: >-
  EMCAP dynamic form and grid metadata contract shared by Angular web,
  Flutter mobile, and backend API. Use when building metadata-driven UI renderers
  or metadata endpoints.
---

# EMCAP Dynamic UI

## Metadata contract

| Type | Endpoint | Client path |
|------|----------|-------------|
| Form | `GET /api/v1/metadata/forms/{entity}` | `clients/web/src/app/metadata/contract.ts`, `clients/mobile/lib/metadata_contract.dart` |
| Grid | `GET /api/v1/metadata/grids/{entity}` | same |

## Required keys

**Form:** `schema_version`, `entity_code`, `sections`, `conditions`, `i18n`

**Grid:** `schema_version`, `entity_code`, `columns`, `export`, `grouping`, `realtime`, `offline`, `i18n`

## Backend builder

`platform/api/src/emcap/metadata/builder.py` — sets `row`, `col`, `span` on form fields.

## Web client (Angular CLI)

| Path | Role |
|------|------|
| `src/app/api/emcap-client.ts` | HTTP client |
| `src/app/services/emcap-api.service.ts` | Injectable wrapper |
| `src/app/metadata/dynamic-form.renderer.ts` | Validation, conditions, layout grid |
| `src/app/metadata/dynamic-grid.renderer.ts` | Sort, filter, group, export |
| `src/app/pages/entity/entity-list.component.ts` | List route — grid only |
| `src/app/pages/entity/entity-record.component.ts` | Record route — form, tabs, actions |
| `src/app/pages/shell/shell.component.ts` | Nav + tenant picker → **Phase 12 module sidenav** |
| `src/index.html` | `window.EMCAP_API_URL` |

Archived Vite implementation: `clients/web-legacy/`.

## Mobile (`clients/mobile/`)

Same contract in `lib/metadata_contract.dart`; entity UX in `lib/app/entity_list_screen.dart` + `entity_record_screen.dart`.

## Contract tests

| Layer | Path |
|-------|------|
| API | `tests/test_metadata_workflow.py` |
| Web (Karma) | `src/app/api/emcap-client.spec.ts`, `dynamic-form.renderer.spec.ts` |
| Mobile | `test/metadata_contract_test.dart` |
