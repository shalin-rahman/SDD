# Conversation architecture, structure, feedback & learnings (2026-06-14)

**Canonical copies:** `docs/product/user-feedback-registry.md` §A–F, §L · `docs/dev/codebase-index.md` · `plan/03-task-backlog.md`  
**External recall:** `C:\Users\u1074139\.cursor\task-summaries\2026-06-14-emcap-architecture-memory.md`

---

## 1. Monorepo structure (layers)

```
Presentation     clients/web (Angular CLI) · clients/mobile (Flutter)
Application      modules/*/ (CQRS, business rules, entity defs)
Platform API     platform/api/src/emcap/ (generic routes, metadata, auth, admin)
Infrastructure   config/, data/seed/, scripts/, infra/
Spec/plan        spec/sdd/, plan/, docs/
```

| Rule | Detail |
|------|--------|
| Business features | `modules/` only — never platform core for module logic |
| Reusable web UI | `clients/web/src/app/shared/` — pages compose shared components |
| Feature flags | `config/platform.yaml` |
| Product gate | `spec/sdd/07-product-readiness-matrix.md` (not pytest alone) |
| API wired gate | `spec/sdd/04-capability-matrix.md` |

---

## 2. Entity UX architecture (Slice 15C — locked)

**User feedback C15 / A15 / B3 superseded:** list and entry are **separate surfaces**, not master–detail on one route.

| Client | List | Record (create/edit) |
|--------|------|----------------------|
| **Web routes** | `/app/entity/:code` | `/app/entity/:code/new`, `/app/entity/:code/:recordId` |
| **Web components** | `entity-list.component.*` | `entity-record.component.*` |
| **Mobile** | `entity_list_screen.dart` | `entity_record_screen.dart` (push, pop back) |

**Rejected (C16 / P15-T16 Cancelled):** forcing all grid columns onto the entry form. Grid metadata drives list; form metadata drives record.

**Removed:** `entity_screen.dart` (mobile), `grid-form-parity` utils, `test_every_grid_column_in_form`.

**15A polish retained:** hero header, section cards, header actions, tabs on **record route**; grid polish on **list route**.

---

## 3. Admin & security architecture (2026-06-14)

| Feature | Storage | API | UI |
|---------|---------|-----|-----|
| ABAC policies | `SettingOverrideRow` `security.abac_policies` | GET/PUT `/admin/security/abac` | Admin Security ABAC table |
| Field `read_roles` overrides | `security.field_overrides` map | PUT `/admin/security/field-access` | Admin Security field matrix + permission picker |
| Runtime enforcement | `app.state.field_overrides` | Entity GET filters fields via `apply_field_security` | — |

**P13-T10/T11 Done · P19-T03 Done** — screenshot `phase19-admin-security-field-access-web.png`

---

## 4. Settings IA (P19-T01 Done)

Mat-tabs: **Modules | Identity | Platform | Integrations**

| Partial slices | Content |
|----------------|---------|
| P19-T05 | Branding live preview (Integrations tab), `BrandingPreviewPanelComponent`, tenant primary via `ThemeService` |
| P19-T06 | Document platform settings read-only (web Platform tab + mobile Settings) |

---

## 5. Standard entity rollout (W1–W5)

- **17 entities** with API fields, pytest, web/mobile fixture parity
- **W5 Done:** `STOCK_MOVEMENT` + `STOCK_MOVEMENT_LINE`, `apply_posted_movement()`, demo seed
- **P18-T04 Done:** PRODUCT `STOCK_ADJUSTMENT` workflow on record route
- **P18-T05 Done:** Report menus via `MenuDefinition.report_code`
- **M4 signed (web)** · **M5 partial** · **M6 partial**

---

## 6. Screenshot & dev tooling learnings

| Learning | Mitigation |
|----------|------------|
| Playwright must click grid row → wait record URL before detail/workflow shots | `capture-screenshot-sprint.mjs`, `capture-m1-screenshots.mjs` |
| Standalone `apply-seed.py` defaults PostgreSQL | Use `start-emcap-local.bat` (SQLite) or set `DATABASE_URL` |
| Stale Vite web → blank app | Restart stack; check `logs/emcap/web.log` |
| Branding TS errors (`primary_color`, tenant map cast) | `Record<string,string>` for tenant merge; `as unknown as` for tenant map |
| Flutter/Dart not on PATH | Mobile code + CI only; M2/P15-T13 PNG blocked locally |
| Mat-tab lazy content in tests | Click tab header; `NoopAnimationsModule` in specs |

**Scripts:** `scripts/capture-screenshot-sprint.mjs` flags: `--only=product-workflow`, `--only=entity-packs`, `--only=admin-security`

**Logs:** `logs/emcap/web.log`, `api.log`, `run.log`, `seed.log`

---

## 7. User feedback summary (excluding “viable product” framing)

| ID | Feedback |
|----|----------|
| A7 | Do not commit before user review |
| A15 / C15 / F1 | Separate list + record pages |
| C16 | **Rejected** — no grid-on-form parity |
| A1 | Read codebase-index + registry before broad search |
| A12 | Matrix 07 for product; 04 for API wired |
| E8 | Flutter not on PATH locally |
| B3 | Master–detail superseded for entity CRUD |
| B9 | Field security editable — **P19-T03 Done** |

---

## 8. Verification snapshot (2026-06-14)

| Suite | Result |
|-------|--------|
| Karma | 173/173 |
| Entity system contract pytest | 79 passed |
| Admin field access pytest | 12 passed |

---

## 9. Open next (honest)

- P15-T13 / P20-T03 — M2 mobile PNGs (Flutter)
- P18-T06 — CRM mobile Product-ready sign-off
- P19-T04–T12 — ABAC polish, integrations, payments, settings DB UX
- P15-T21 — WAREHOUSE/CRM redesign polish
- P15-T14 — mobile SSE grid refresh

**No git commits** unless user explicitly asks.
