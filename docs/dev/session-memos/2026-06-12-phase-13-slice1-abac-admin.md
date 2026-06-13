# Phase 13 Slice 1 — ABAC policy admin

## Goal
Start Phase 13 with ABAC policy builder (deferred from Phase 12F).

## What changed
- `plan/13-enterprise-admin-depth.md` — Phase 13 plan + slices
- `config/platform.yaml` — `security.abac_policies` defaults
- `security_service.py` — load/get/update ABAC via `SettingOverrideRow`
- `GET/PUT /admin/security/abac`, `admin.security.write` permission
- `app.state.abac_policies`; `/auth/check` uses runtime policies
- Web/mobile admin security — ABAC table editor
- Matrix rev. 7, backlog P13-T01–T06 Done

## Verification
`pytest tests/test_admin_api.py::test_admin_abac_policies tests/test_auth_security.py::test_abac_check` — 2 passed

## Next
P13-T10 field `read_roles` overrides, P13-T20 isolation write, P13-T30 layout designer ADR.
