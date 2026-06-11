# SaaS and white-label shell behavior (SDD §3)

## Config modes

| `platform.yaml` | Behavior |
|-----------------|----------|
| `multi_tenant: false` | Single org; default tenant from login |
| `multi_tenant: true` | SaaS; shell must send correct `X-Tenant-ID` |
| `white_label: true` | Per-tenant branding (domains in tenancy middleware) |

## Implementation (Phase 7 P7-T12)

1. **Login** — response includes `tenant_id`; call `client.setToken(token, tenantId)`.
2. **Tenant picker** — if health reports `multi_tenant: true`, allow switching tenant (admin only) or display current tenant in header.
3. **White-label** — fetch `GET /api/v1/config/platform` or tenant theme endpoint; apply CSS variables on web (`document.documentElement.style`) and `ThemeData` on mobile.
4. **Do not** hard-code tenant IDs in clients.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_auth_security.py -k tenant
```
