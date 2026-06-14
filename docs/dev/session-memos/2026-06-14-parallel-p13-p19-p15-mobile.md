# Parallel push — P13/P19/P15 mobile (2026-06-14)

## Completed (uncommitted)

### P13-T10/T11 — Field read_roles override API
- `PUT /admin/security/field-access`, `security.field_overrides` in DB
- Merged in policies GET + `apply_field_security` on entity routes
- `test_admin_field_access_override.py`

### P19-T03/T04 — Admin security UI
- Field matrix + permission picker edit on `/app/admin/security`
- ABAC delete confirm + inline validation
- Screenshot: `phase19-admin-security-field-access-web.png`
- Karma 165/165

### P15-T22/T23 mobile — Done
- List loading/retry, empty grid + New CTA

### P19-T06 — Document settings (web + mobile)
- Platform tab read-only document cards; mobile mirror in settings_screen

### Screenshots
- Entity packs refreshed (8 PNGs, separate routes)
- Admin security field access PNG

## Still open
- P15-T13 / P20-T03 mobile PNGs (Flutter)
- P19-T05 branding preview, P19-T07+, P18-T06 mobile Product-ready
- P19-T03 → mark Done after manual verify save field access E2E

No commit per user rule.
