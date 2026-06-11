---
name: emcap-multi-tenancy
description: >-
  EMCAP multi-tenancy modes, tenant isolation strategies, middleware, and
  white-label configuration. Use when implementing tenant context, isolation,
  or SaaS deployment modes.
---

# EMCAP Multi-Tenancy

## Deployment modes (SDD §3)

| Config | Mode |
|--------|------|
| `platform.multi_tenant: false` | Single organization |
| `platform.multi_tenant: true` | SaaS multi-tenant |
| `platform.white_label: true` | Tenant branding/domains/themes |

## Isolation strategies (SDD §4)

Configured via `tenant_strategy.mode`:

| Mode | Implementation |
|------|----------------|
| `shared_database` | `tenant_id` column filter (default) |
| `schema_per_tenant` | PostgreSQL `SET search_path` per session |
| `database_per_tenant` | Separate DB per tenant (adapter stub) |
| `hybrid` | Default tenant shared; others schema-per-tenant |

Code: `emcap.tenancy.strategies`

## Tenant resolution

`TenantMiddleware` resolves tenant from:

1. `X-Tenant-ID` header
2. Host domain match against `config.tenants.*.domain`
3. Fallback: `default`

## White-label

```yaml
tenants:
  acme:
    domain: acme.local
    theme: acme-blue
```

API: `GET /api/v1/tenants`

## Client shell (Phase 8)

When `platform.multi_tenant: true`, shells show a tenant picker and send `X-Tenant-ID` on every request.

| Concern | Web | Mobile |
|---------|-----|--------|
| Tenant picker | `main.ts` header `<select>` | `shell.dart` `DropdownButton` |
| White-label theme | CSS vars on `:root` | `lib/theme.dart` (`EmcapTheme`) |

Full guide: `docs/dev/saas-shell.md` · Pitfall: do not import `main.dart` from `shell.dart`.

## Rules

1. Every entity record must include `tenant_id`
2. Repository queries always filter by tenant
3. Never mix tenant data in responses
