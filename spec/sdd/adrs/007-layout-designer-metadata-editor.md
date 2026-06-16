# ADR-007: Layout designer (metadata editor)

## Status

Accepted — 2026-06-16 · **API phase Done** (P13-T31 storage + merge + admin CRUD) · **UI deferred** post-M3 (P13-T32)

## Context

EMCAP renders entity list and record pages from **server-built metadata** (`FormMetadata`, `GridMetadata`) emitted by `build_form_metadata` / `build_grid_metadata` in `platform/api/src/emcap/metadata/builder.py`. Layout today is code-defined on `EntityDefinition` fields in `modules/` — section order, grid columns, and field `row`/`col`/`span` come from the builder, not tenant-specific overrides.

Stakeholder feedback (registry §I): a **visual layout designer** is desired for admin users, but building a full WYSIWYG before the entity platform baseline (lookup, status chip, field types, soft delete, security-filtered metadata) would produce throwaway UI.

Phase 13 slice 4 (`plan/13-enterprise-admin-depth.md`) and Phase 19 task P19-T08 require an ADR and metadata edit API design **before** any editor MVP.

## Decision

### 1. Scope boundary

| In ADR / API design (now) | Deferred (post-M3) |
|---------------------------|---------------------|
| Metadata override storage model | Drag-and-drop form canvas |
| Admin CRUD API for layout overrides | Live preview in admin shell |
| Merge order: SDK → tenant override → security filter | Grid column reorder UI |
| Validation against entity field registry | Mobile layout editor |
| Audit + version on override save | Runtime hot-reload without API restart |

**No layout designer UI** ships until M3 milestone rows in `07-product-readiness-matrix.md` are **Product-ready (web)** for lookup, status, currency/textarea, and soft-delete UX.

### 2. Override storage

- **Table:** `tenant_layout_override` (PostgreSQL), keyed by `(tenant_id, entity_code, layout_kind)` where `layout_kind ∈ {form, grid}`.
- **Payload:** JSON document matching existing Pydantic schemas (`FormMetadata` / `GridMetadata` subset — see MVP below).
- **Source of truth chain:** `EntityDefinition` (module SDK) → optional tenant override → `filter_*_metadata_dict` (field security) → client.
- **System fields:** Overrides may **reorder/hide** system section fields in form metadata and system columns in grid metadata, but may not remove required system columns from API responses (`created_at`, `id`, etc.).

### 3. Metadata edit API (MVP)

Platform routes under `/api/v1/admin/metadata/layouts` (admin permission `admin.metadata.write`):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/metadata/layouts/{entity_code}` | Return effective form + grid metadata (merged, pre-security) + override provenance |
| `GET` | `/admin/metadata/layouts/{entity_code}/override` | Return raw tenant override JSON or 404 |
| `PUT` | `/admin/metadata/layouts/{entity_code}/override` | Upsert override; validate against entity field registry |
| `DELETE` | `/admin/metadata/layouts/{entity_code}/override` | Revert to SDK defaults |

Request body (PUT) shape:

```json
{
  "form": {
    "sections": [
      {
        "code": "business",
        "fields": [
          { "name": "sku", "row": 0, "col": 0, "span": 6, "read_only": false }
        ]
      }
    ]
  },
  "grid": {
    "columns": [
      { "field": "sku", "sortable": true, "filterable": true, "width": 120 }
    ]
  }
}
```

**Not editable via override (MVP):** field types, validation rules, lookup targets, enum options, `display.status_field` — those remain on `FieldDefinition` in module code until a separate field-designer ADR.

### 4. Builder merge rules

1. Load SDK metadata via existing builders.
2. If tenant override exists, apply:
   - **Form:** match fields by `name`; update `row`, `col`, `span`, `read_only`; reorder sections by override section list; drop unknown field names.
   - **Grid:** reorder/filter columns by override list; update `width`, `sortable`, `filterable`; unknown columns ignored.
3. Run `validate_entity_for_metadata` + existing security filters before GET responses to end users.
4. Increment `schema_version` patch when override merge semantics change.

### 5. Editor MVP (P13-T31 / P13-T32 — future)

Web admin page under Settings → **Layouts** (or Admin → Metadata):

- Entity picker (entities user may admin)
- **Form tab:** section list + field table (row/col/span/spans); no new fields
- **Grid tab:** column checklist + order (up/down); width/sortable/filterable toggles
- Save → PUT override; Reset → DELETE override
- Uses same merged GET for preview panel (read-only until post-MVP)

Mobile: **read-only** effective metadata only; no editor.

### 6. Security and tenancy

- Overrides are **tenant-scoped**; never global across tenants.
- `admin.metadata.write` required for PUT/DELETE; read requires `admin.metadata.read` or entity admin role (TBD in P13-T31).
- All writes audited (`audit_log` pattern from ABAC admin).
- End-user GET `/metadata/form|grid/{entity}` unchanged — still passes through field-level security.

## Consequences

- Modules keep registering fields in Python; layout customization becomes tenant ops without hot-patching code.
- Clients (web/mobile) unchanged for MVP — they already consume merged metadata JSON.
- Migration: new SQL migration for `tenant_layout_override` when P13-T31 starts implementation.
- Tests: pytest for merge + validation + tenant isolation; Karma for admin editor when UI lands.
- **Out of scope:** formula fields, custom widgets, cross-entity layout templates, i18n label editing in designer (labels stay in builder i18n maps).

## References

- `plan/13-enterprise-admin-depth.md` — Slice 4 (P13-T30–T32)
- `plan/19-admin-product-depth.md` — P19-T08
- `platform/api/src/emcap/metadata/builder.py` — current builders
- `platform/api/src/emcap/metadata/form_schema.py`, `grid_schema.py`
- `platform/api/src/emcap/metadata/security.py` — post-merge filter
- `spec/sdd/07-product-readiness-matrix.md` — M3 gate
- FR-008d layout designer — ADR only until M3 complete
