# Recipe — MFA login + enrollment UI

## Checklist

1. Client methods: `enrollMfa()`, `verifyMfa(code)` — match `auth.py` routes.
2. Account screen — show secret/QR placeholder + verify input.
3. Login — if API returns MFA required, show second step before `setToken`.
4. Add to `REQUIRED_METHODS` in `emcap-client.test.ts`.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_auth_security.py -k mfa
```
