---
name: emcap-enterprise-ui
description: >-
  EMCAP Phase 12 enterprise product shell, module-grouped navigation, master-detail
  entity UX, i18n/themes, admin users/roles, and platform settings hub. Use when
  implementing admin consoles, settings UI, responsive shell, or FR-008d work.
---

# EMCAP Enterprise Product UI (Phase 12)

## Read first (mandatory)

1. `plan/12-enterprise-product-ui.md` — full SDD crosswalk + task IDs
2. `plan/12-phase12-dod-checklist.md` — **Do not mark Done without this**
3. **`clients/web/src/app/shared/README.md`** — reusable components (use first)
4. `spec/sdd/06-admin-product-ui-matrix.md` — honest UX gap (not 04/05 alone)
5. **`docs/dev/recipes/sync-docs-after-change.md`** — update docs in same PR
6. `docs/dev/known-pitfalls.md` — Phase 12 section

## Requirement ID

**FR-008d** — module nav, master–detail, i18n/themes, admin users/roles, settings hub.  
Maps to SDD §3, §5–§7, §9, §13–§16, §26, §30.

## What went wrong before (do not repeat)

| Trap | Fix |
|------|-----|
| API exists, no UI → matrix "Done" | Update **06** matrix; UI + test required |
| Flat nav ignores `menu.module` | Group sidenav by `module` from `GET /menus` |
| Account page = admin | Use `/app/admin/*` and `/app/settings/*` |
| Config YAML-only changes | Admin `GET/PUT /admin/settings` + audit |
| Feature nav always visible | Gate from `GET /config/platform` `modules.*.enabled` |
| Edit creates duplicate row | Branch on `selectedRecordId` → update vs create |
| Client method without test | `emcap-client.spec.ts` `REQUIRED_METHODS` |
| Demo seed breaks pytest | `platform-test.yaml` demo off |
| **Code merged; docs stale** | `sync-docs-after-change.md` same PR |

## Architecture boundaries

| Layer | Path | Phase 12 work |
|-------|------|---------------|
| Admin/settings API | `platform/api/src/emcap/api/routes/admin/` (new) | Users, roles, settings |
| Identity services | `platform/api/src/emcap/auth/` | Extend rbac, user CRUD |
| Settings persistence | Config subset + DB rows for templates | Not raw YAML edit in UI |
| Business modules | `modules/` | **No** admin UI here |
| **Shared web UI** | `clients/web/src/app/shared/` | Layout, grid, forms, nav — **reuse, don't duplicate** |
| Web shell | `pages/shell/` | Thin wrapper over `AppLayoutComponent` |
| Web admin | `pages/admin/` (new) | Compose `MasterDetailLayout` + `PageHeader` |
| Web settings | `pages/settings/` (new) | Settings sections |
| Entity UX | `pages/entity/` | Composes shared master–detail + grid + form |
| Mobile | `clients/mobile/lib/app/` | Parity after web slice |

## Key API surfaces (today vs Phase 12)

| Today | Phase 12 add |
|-------|--------------|
| `GET /menus` → `{ module, code, label, entity_code, permission }` | Filter by enabled module + user permission |
| `GET /auth/roles`, `POST /auth/roles/assign` | CRUD `/admin/users`, `/admin/roles` |
| `GET /config/platform` (read) | `PUT /admin/settings` (validated subset) |
| — | Notification template CRUD |

**Menus API** already returns `module` — shell must consume it (`menus.py` line 15).

## Web implementation patterns

### Module-grouped nav

```typescript
// Group menus by menu.module; sort module keys alphabetically
const byModule = Map.groupBy(menus, (m) => m.module ?? 'platform');
```

Filter before group:

1. `config.modules[moduleKey]?.enabled !== false`
2. User permissions include `menu.permission` (from `/auth/me`)

### Master–detail entity

- **Desktop:** `mat-sidenav-container` — list ~40% / form ~60%
- **Mobile:** list full width; selecting row opens bottom sheet or full-width detail
- **Same route:** `/app/entity/:code` — no separate edit route
- Tabs in detail panel: Form | Notes | Documents | Audit | Workflow

### i18n

- App chrome: `assets/i18n/en.json`, `bn.json` (or `@angular/localize`)
- Metadata: keep `field.label_key` resolution in renderers
- Locale persisted: `localStorage` + optional `Accept-Language` header later

### Themes

- CSS vars: `--emcap-primary`, `--emcap-surface`, light/dark class on `body`
- Load tenant primary from config / `listTenants()`
- `ThemeService` in `clients/web/src/app/services/theme.service.ts`

### Angular Material

Use shared components under `clients/web/src/app/shared/` — see `shared/README.md`.

Reuse for admin (P12B): `AppLayoutComponent`, `MasterDetailLayoutComponent`, `PageHeaderComponent`, `DynamicDataGridComponent`, `DynamicFormViewComponent`.

## Admin route layout

```
/app/admin/users
/app/admin/roles
/app/admin/permissions   (matrix read-only)
/app/settings            (hub)
/app/settings/modules
/app/settings/notifications
/app/settings/payments
/app/settings/templates
```

Guard: user has `admin.users.read` or `*.*` (seed in `data/seed/core/roles.json`).

## Tests per deliverable

| Deliverable | Test |
|-------------|------|
| Admin API | `tests/test_admin_users.py`, `test_admin_settings.py` |
| Shell grouping | Component test: menus → module sections |
| Master–detail | Component test: select row → form bound |
| Client methods | `emcap-client.spec.ts` |
| Auth denial | pytest 403 without permission |
| Matrix | Same PR updates `06-admin-product-ui-matrix.md` |

## Verify (every PR)

```bat
scripts\lint-format.bat
cd platform\api && python -m pytest -q
cd clients\web && npm run build && npm run test:ci
scripts\run-emcap.bat --stack-only --local --skip-tests --skip-lint
```

Manual: module sidenav · Product master–detail edit · locale switch · admin user create.

## Phase 13 (explicitly not Phase 12)

Layout designer, full ABAC builder, tenant isolation **write**, in-app Grafana.

## Related skills

- `emcap-dynamic-ui` — renderers, metadata contract
- `emcap-identity-authz` — RBAC, MFA, permissions
- `emcap-config` — platform.yaml keys for settings UI
- `emcap-testing` — coverage + contract tests
- `emcap-codebase-map` — index + recipes entry point
