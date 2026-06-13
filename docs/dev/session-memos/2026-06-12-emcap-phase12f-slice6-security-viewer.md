# Phase 12F Slice 6 — Security policy viewer

## Goal
P12F-T40–T46: read-only row/field security viewer from EntityDefinition registry.

## What changed
- **Backend:** `security_service.py`, `GET /api/v1/admin/security/policies`, `admin.security.read` permission.
- **Module:** PRODUCT `unit_price` field `read_roles=["inventory.access"]` for demo snapshot.
- **Tests:** `test_admin_security_policies` — 9/9 admin tests pass.
- **Web:** `/app/admin/security` master–detail viewer; nav links on admin pages.
- **Mobile:** `admin_security_screen.dart`, shell nav entry.
- **Seed:** `admin.security.read` in roles.json admin role.
- **i18n:** admin.security.* keys EN/FR/BN.

## Verification
```powershell
cd platform/api
python -m pytest tests/test_admin_api.py -q   # 9 passed
```

## Next (dependency order)
- Slice 7: Mobile rail module headers (P12F-T50–T53)
- Slice 8: Matrix rev. 6 + traceability
