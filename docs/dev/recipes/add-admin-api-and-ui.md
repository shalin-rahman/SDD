# Recipe — Admin API + UI (Phase 12B–C)

Add platform admin endpoints and matching web/mobile admin screens.

**Playbook:** `plan/12-enterprise-product-ui.md`  
**DoD:** `plan/12-phase12-dod-checklist.md`  
**Skills:** `emcap-enterprise-ui`, `emcap-identity-authz`, `emcap-config`

---

## Checklist (every admin feature)

1. Pydantic request/response models in `platform/api/src/emcap/admin/` (new package)
2. Route in `platform/api/src/emcap/api/routes/admin/` — register in `main.py`
3. Permission decorator: require `admin.<resource>.<action>`
4. pytest: success, 403 without permission, 422 validation
5. `emcap-client.ts` + `emcap_client.dart` + `emcap-client.spec.ts`
6. Web page under `clients/web/src/app/pages/admin/` or `settings/`
7. Audit log entry for mutations (settings especially)
8. Seed permissions in `data/seed/core/roles.json`
9. **Doc sync:** `docs/dev/recipes/sync-docs-after-change.md` (backlog, matrix 06, index, recipes, skills)
10. Update `clients/web/src/app/shared/README.md` if new reusable UI added

---

## Users API (P12B-T01)

```
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/{id}
PUT    /api/v1/admin/users/{id}
PATCH  /api/v1/admin/users/{id}/deactivate
POST   /api/v1/admin/users/{id}/reset-password
```

Reuse `UserRow` in persistence; hash passwords like existing login flow.

**Never** return password hash in GET.

---

## Roles API (P12B-T02)

```
GET    /api/v1/admin/roles
POST   /api/v1/admin/roles
PUT    /api/v1/admin/roles/{id}
```

Body includes `permissions: string[]`. Validate against known permission strings from registry.

---

## Settings API (P12C-T01)

```
GET /api/v1/admin/settings
PUT /api/v1/admin/settings
```

**Writable subset only** (whitelist keys):

- `modules.*.enabled`
- `notifications.email|sms|push|…`
- `payments.enabled`, `payments.providers[]` (secrets masked)
- `workflow.*`, `rules.*`, `grid.*`, `audit.*`, `authentication.*` (booleans only)
- `platform.white_label` branding fields

Implementation options:

1. Merge into in-memory config + write YAML (dev only) — document risk
2. **Preferred:** `settings_overrides` table + merge at load time

Always append audit row: who changed what.

---

## Notification templates (P12C-T03)

New table `notification_templates`: `code`, `channel`, `subject`, `body`, `variables`.

CRUD under `/api/v1/admin/templates`.

Seed examples in `data/seed/core/templates.json`.

---

## Web UI patterns (reuse shared components)

| Screen | Shared components |
|--------|-------------------|
| Users | `PageHeaderComponent` + `MasterDetailLayoutComponent` + list table or custom grid |
| Roles | Same master–detail; permission grid in detail pane |
| Settings | `PageHeaderComponent` + section nav (settings hub) |
| Templates | Master–detail + textarea editor in detail pane |

Do **not** copy sidenav/shell markup — already in `AppLayoutComponent`.

Route guards: `AdminGuard` checks `/auth/me` permissions.

---

## Mobile (P12D)

Read-only first: list users/roles, view settings flags.  
Full CRUD after web stable.

---

## Verify

```bat
cd platform\api && python -m pytest -q tests/test_admin_*.py
scripts\lint-format.bat
cd clients\web && npm run test:ci
```

Manual: create user → login as user → toggle notification flag → confirm UI hides channel.

---

## Architecture rule

Admin is **platform** (`platform/api`), not `modules/inventory/`.  
Business entities stay module-scoped; admin manages identity and config only.
