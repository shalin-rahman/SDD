# Phase 12 — full feedback crosswalk review (2026-06-12)

## Goal
Honest item-by-item review of every user feedback point vs `spec/framework-sdd.txt` and current code.

## Verification (no terminal errors)
- `python -m pytest -q --cov=src --cov-fail-under=80` → **77 passed**, **89%** total
- `npm run build` → **OK**
- `npm run test:ci` → **23/23 passed**

---

## Feedback checklist (each item)

| # | Requirement | Web | Mobile | Status | Evidence / gap |
|---|-------------|-----|--------|--------|----------------|
| 1 | Module-grouped menus | Done | No | Partial | `shell-nav.util.ts`, `sidenav-nav.component.html`; mobile `shell.dart` flat |
| 2 | Module on/off (entire module) | Partial | No | Partial | Settings → Modules toggles; reloads nav via `shellContext.load()` on save; business modules in `modules/` not individually toggled |
| 3 | List + edit on single page (master-detail) | Done | Partial | Partial | Entity + admin users/roles + email templates use `MasterDetailLayoutComponent`; mobile entity stacked |
| 4 | Responsive grids | Partial | Partial | Partial | `dynamic-data-grid` scroll + sticky header; entity grid still plain HTML controls |
| 5 | Multi-language | Partial | No | Partial | Toolbar EN/FR (`I18nService`); most page copy still English |
| 6 | Theme support | Partial | No | Partial | Light/dark toggle (`ThemeService`); mobile static theme |
| 7 | User management | Done | No | Partial | `/app/admin/users`, API CRUD, deactivate |
| 8 | Role management | Done | No | Partial | `/app/admin/roles`, API CRUD |
| 9 | Permission setup (editable) | Partial | No | Partial | `PermissionPickerComponent` on roles; matrix read-only at `/app/admin/permissions` |
| 10 | Settings / configuration UI | Partial | No | Partial | `/app/settings` hub: modules, auth, grid, workflow, rules, payments, AI, audit, branding, templates |
| 11 | Payment configuration | Partial | No | Partial | Enable toggle only; gateway secrets deployment-only (by design) |
| 12 | Email templates | Partial | No | Partial | API CRUD; settings list+edit pane; create/update/delete wired |
| 13 | Other basic setups | Partial | No | Partial | Auth/grid/workflow/rules/notifications/audit/tenant strategy/observability/security read-only sections |
| 14 | Reusable components | Done | — | Done | `clients/web/src/app/shared/` layout, admin, utils |
| 15 | Coverage ≥80% | API yes | — | Partial | Backend 89%; web util specs only (no page component specs) |
| 16 | Mobile parity | — | No | No | All P12D pending |

---

## UX fixes applied this session
- `DetailPlaceholderComponent` accepts `@Input() message`
- Admin users/roles: separate list pane vs form pane; save keeps selection on desktop
- Mobile back via `PageHeaderComponent` showBack
- Permission picker: grouped checkboxes (not comma text)
- Settings: aligned toggle rows; template master-detail; shell nav refresh after save
- Removed non-persisted payment provider text field

---

## Still open (Phase 13 / next PRs)
- **P12D** mobile: grouped nav, master-detail, theme/i18n, admin/settings read-only
- **P12C** integrations registry, document settings, report schedules
- **P12B-T08** row/field security viewer
- **i18n** full page catalogs (`assets/i18n/*.json`)
- **Entity grid** Material toolbar/forms polish
- **Settings runtime** DB overrides vs YAML hot-reload
- **Per-file** legacy auth coverage (`rbac.py`, `security.py`) below 80% (total gate passes)

---

## Docs updated
- `spec/sdd/06-admin-product-ui-matrix.md` summary footer
- `plan/03-task-backlog.md` P12C statuses
- `clients/web/src/app/shared/README.md` admin components
