---
name: emcap-entity-sdk
description: >-
  EMCAP EntityDefinition and ModuleDefinition SDK for registering entities and
  business modules. Use when creating entities, modules, or platform code
  generation for APIs, forms, grids, and audit.
---

# EMCAP Entity SDK

## EntityDefinition (SDD §8)

```python
EntityDefinition(
    code="CUSTOMER",
    audit_enabled=True,
    workflow_enabled=True,
    notes_enabled=True,
    document_enabled=True,
)
```

Platform generates: REST CRUD, search, dynamic form, grid metadata, audit hooks, documents, notes.

## ModuleDefinition (SDD §26–27, 30)

```python
ModuleDefinition(
    entities=[],
    workflows=[],
    reports=[],
    dashboards=[],
    menus=[],
)
```

Platform auto-provides: permissions, menus, localization, notifications, DevOps integration.

## Rules

1. Business modules declare definitions only — no edits to `platform/` core.
2. Entity `code` is uppercase stable identifier (e.g. `CUSTOMER`, `INVOICE`).
3. Register entities at module load time via `EntityRegistry` on app startup.
4. Generated APIs live under `/api/v1/entities/{code}/`.

## Reference modules

| Module | Entities | Path |
|--------|----------|------|
| `demo` | `CUSTOMER` | `modules/demo/module.py` |
| `inventory` | `PRODUCT`, `WAREHOUSE` | `modules/inventory/module.py` |
| `crm` | `LEAD`, `CONTACT` | `modules/crm/module.py` |

Avoid entity code clashes across modules (e.g. CRM uses `LEAD`/`CONTACT`, not `CUSTOMER`).

## Implementation status

| Component | Path |
|-----------|------|
| Config loader | `platform/api/src/emcap/config/` |
| Entity registry | `platform/api/src/emcap/entity/registry.py` |
| Module loader | `platform/api/src/emcap/module/loader.py` |
| Metadata API | `platform/api/src/emcap/api/routes/metadata.py` |
| Metadata builder | `platform/api/src/emcap/metadata/builder.py` |

## References

- `spec/sdd/01-requirements.md` — FR-006, FR-018, FR-019
- `modules/README.md`
