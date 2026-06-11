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

## Document safety

- `DocumentHooks.scan_virus()` — pluggable hook (default returns `clean`)
- Store files under tenant-scoped paths: `{tenant}/{entity}/{record}/{id}/{filename}`

## Client shell

Account and login views surface flag-gated features (payments, REST dispatch, MFA). See `emcap-identity-authz` and `clients/web/src/app/main.ts`, `clients/mobile/lib/app/account_screen.dart`.

## Related skill

See `emcap-identity-authz` for RBAC, ABAC, MFA, and JWT patterns.
