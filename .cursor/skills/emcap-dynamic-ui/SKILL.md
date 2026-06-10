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

## Client renderers

- Angular: `DynamicFormRenderer`, `DynamicGridRenderer` in `clients/web/src/`
- Flutter: `DynamicFormRenderer`, `DynamicGridRenderer` in `clients/mobile/lib/`

## Contract tests

`tests/test_metadata_workflow.py::test_metadata_contract_keys`

Fixtures: `tests/fixtures/metadata/`
