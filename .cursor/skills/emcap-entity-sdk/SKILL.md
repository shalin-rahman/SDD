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
3. Register entities at module load time via platform registry (Phase 1).
4. Generated APIs live under `/api/v1/entities/{code}/`.

## Implementation status

| Component | Phase | Path |
|-----------|-------|------|
| Config loader | 0 ✓ | `platform/api/src/emcap/config/` |
| Entity registry | 1 | TBD |
| Module loader | 1 | `modules/` |
| Metadata API | 2 | TBD |

## References

- `spec/sdd/01-requirements.md` — FR-006, FR-018, FR-019
- `modules/README.md`
