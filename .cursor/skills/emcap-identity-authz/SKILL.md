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

- Policies in `emcap.auth.abac.DEFAULT_POLICIES`
- Check via `POST /api/v1/auth/check`

## Row / field security

- Row: `tenant_id` on all entity records; resolved via `X-Tenant-ID` header
- Field: `FieldDefinition.read_roles` — filter via `apply_field_security()`

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
| Permissions viewer | Account (demo) | Account |

## Admin UX (Phase 12 — planned)

| Feature | API target | Web target |
|---------|------------|------------|
| User CRUD | `GET/POST/PUT /admin/users` | `pages/admin/users/` |
| Role CRUD | `GET/POST/PUT /admin/roles` | `pages/admin/roles/` |
| Permission matrix | read from roles + registry | `pages/admin/permissions/` |
| Settings hub | `GET/PUT /admin/settings` | `pages/settings/` |

Today: only `GET /auth/roles`, `POST /auth/roles/assign` — **not** admin CRUD.

Seed admin permissions: `data/seed/core/roles.json` → `admin.users.*`, `admin.settings.*`.

See skill **`emcap-enterprise-ui`** and recipe `docs/dev/recipes/add-admin-api-and-ui.md`.

Tests: `tests/test_auth_security.py` today; add `tests/test_admin_*.py` in Phase 12B.
