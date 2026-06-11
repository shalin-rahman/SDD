# SaaS and white-label shell behavior (SDD §3)

## Config modes

| `platform.yaml` | Behavior |
|-----------------|----------|
| `multi_tenant: false` | Single org; default tenant from login |
| `multi_tenant: true` | SaaS; shell must send correct `X-Tenant-ID` |
| `white_label: true` | Per-tenant branding (domains in tenancy middleware) |

## Implementation (Phase 7–8)

### Login

- Response includes `tenant_id`; call `client.setToken(token, tenantId)`.
- OAuth: `getAuthProviders()` → `loginOAuth()` when `oauth: true`.

### Tenant picker

- When `GET /api/v1/health` reports `multi_tenant: true`:
  - **Web:** `<select>` in header; `client.setTenantId(id)` on change.
  - **Mobile:** `DropdownButton` in shell banner; `client.setTenantId(id)`.

### White-label themes

- `GET /api/v1/tenants` → `white_label: true` applies branding:
  - **Web:** `document.documentElement.style.setProperty('--emcap-primary', ...)`.
  - **Mobile:** `EmcapTheme.seedColor` in `lib/theme.dart` (avoid circular import with `shell.dart`).

### Do not

- Hard-code tenant IDs in clients.
- Import `main.dart` from `shell.dart` — use `theme.dart` for shared theme state.

## Files

| Client | Path |
|--------|------|
| Web shell | `clients/web/src/app/main.ts` |
| Mobile shell | `clients/mobile/lib/app/shell.dart` |
| Mobile theme | `clients/mobile/lib/theme.dart` |

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_auth_security.py -k tenant
```

Manual: enable `multi_tenant: true` in config; confirm tenant dropdown appears after login.
