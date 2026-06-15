---
name: emcap-security
description: >-
  EMCAP security controls including auth middleware, rate limiting, security
  headers, tenant isolation, document virus scan hooks, and feature-flag gates.
  Use when hardening routes or adding security-sensitive platform features.
---

# EMCAP Security

## Request pipeline (order)

1. `TenantMiddleware` — resolves tenant from header/domain
2. `JsonLoggingMiddleware` — structured access logs
3. `MetricsMiddleware` — Prometheus counters
4. `RateLimitMiddleware` — 120 req/min per IP+path
5. `SecurityHeadersMiddleware` — OWASP response headers

## Feature-flag gates

| Subsystem | Config keys |
|-----------|-------------|
| Notifications | `modules.notifications.enabled`, `notifications.{email,sms,push,whatsapp}` |
| Payments | `modules.payments.enabled`, `payments.enabled` |
| AI | `modules.ai.enabled`, `ai.enabled` |

Disabled modules return HTTP 403 from route handlers.

## Field security (metadata + record)

| Layer | Module | Behavior |
|-------|--------|----------|
| Metadata | `emcap/metadata/security.py` | Filter form/grid fields by effective `read_roles` + `field_overrides` |
| Record GET | same `apply_field_security()` | Omit secured fields from JSON response |
| Admin overrides | `PUT /admin/security/field-access` | Persisted in `security.field_overrides` settings row |
| Web defense | `field-security.util.ts` | Hide fields not present in secured record payload (P23-T02) |

## Admin security routes

- `GET /admin/security/policies` — row/field policy viewer
- `GET/PUT /admin/security/abac` — ABAC policy CRUD
- `PUT /admin/security/field-access` — per-entity field `read_roles` overrides
- `POST /auth/check` — runtime ABAC evaluation (admin test preview)

## Document safety

- `DocumentHooks.scan_virus()` — pluggable hook (default returns `clean`)
- Store files under tenant-scoped paths: `{tenant}/{entity}/{record}/{id}/{filename}`

## Client shell

Account and login views surface flag-gated features (payments, REST dispatch, MFA). Admin security UI at `/app/admin/security`. See `emcap-identity-authz` for RBAC/ABAC/MFA detail.

## Related skill

See `emcap-identity-authz` for RBAC, ABAC, MFA, JWT, and admin CRUD patterns.

Tests: `tests/test_admin_field_access_override.py`, `tests/test_admin_abac_policies.py`, `field-security.util.spec.ts`
