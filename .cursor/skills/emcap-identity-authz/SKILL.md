---
name: emcap-identity-authz
description: >-
  EMCAP authentication and authorization patterns including provider registry,
  RBAC, ABAC, MFA, row/field security, and security middleware. Use when
  implementing auth, permissions, or security controls.
---

# EMCAP Identity & Authorization

## Auth providers (SDD §7)

Configured in `config/platform.yaml` under `authentication.*`.

| Provider | Route | Registry name |
|----------|-------|---------------|
| Username/password | `POST /api/v1/auth/login` | `username_password` |
| OAuth client credentials | `POST /api/v1/auth/oauth/token` | `oauth` |

Registry: `emcap.auth.providers.registry.AuthProviderRegistry`

## RBAC

- Roles in `roles` table; assignments in `user_roles`
- `GET /api/v1/auth/roles`
- `POST /api/v1/auth/roles/assign`
- Permissions generated from entities + module metadata

## ABAC

- Policies in `SettingOverrideRow` `security.abac_policies` (admin-editable)
- `GET/PUT /api/v1/admin/security/abac`
- Runtime check via `POST /api/v1/auth/check`
- Admin UI test preview in `pages/admin/admin-security.component`

## Row / field security

- Row: `tenant_id` on all entity records; resolved via `X-Tenant-ID` header
- Field (record GET): `FieldDefinition.read_roles` merged with `security.field_overrides` → `apply_field_security()` in `metadata/security.py`
- Field (metadata): `GET /metadata/forms|grids/{entity}` filters fields by effective `read_roles` (P23-T01) — do not rely on UI hide alone

## MFA

- `POST /api/v1/auth/mfa/enroll`
- `POST /api/v1/auth/mfa/verify`

## Security middleware

- `SecurityHeadersMiddleware` — OWASP response headers
- `RateLimitMiddleware` — 120 req/min per IP+path

## JWT

- Secret: `EMCAP_JWT_SECRET` env var
- Bearer token in `Authorization` header

## Client shell UX (Phase 8)

| Feature | Web | Mobile |
|---------|-----|--------|
| Login | `clients/web/src/app/pages/login/` | `clients/mobile/lib/app/shell.dart` |
| OAuth / MFA | Account pages | `account_screen.dart` |

## Admin UX (Phase 12/19 — implemented)

| Feature | API | Web | Mobile |
|---------|-----|-----|--------|
| User CRUD | `GET/POST/PUT /admin/users` | `pages/admin/admin-users.component` | — |
| Role CRUD | `GET/POST/PUT /admin/roles` | `pages/admin/admin-roles.component` | — |
| Permission matrix | read from roles + registry | `pages/admin/permissions/` | — |
| Settings hub | `GET/PUT /admin/settings` | `pages/settings/` | `settings_screen.dart` |
| Field access overrides | `PUT /admin/security/field-access` | `pages/admin/admin-security.component` | `updateAdminFieldAccess` in `emcap_client.dart` |
| ABAC policies | `GET/PUT /admin/security/abac` | same + `checkAuth` test preview | — |
| Policy viewer | `GET /admin/security/policies` | admin security screens | — |

## Web defense in depth (P23-T02)

`clients/web/src/app/shared/utils/field-security.util.ts` — hide form fields absent from secured record payload even if metadata still lists them.

Tests: `tests/test_admin_api.py`, `tests/test_admin_field_access_override.py`, `field-security.util.spec.ts`, `clients/mobile/test/admin_field_access_client_test.dart`
