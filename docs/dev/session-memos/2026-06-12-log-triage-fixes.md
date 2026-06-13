# Log triage — fixes from logs/emcap

## Issues found
1. **Stale API** — OpenAPI had 50 routes, no `/admin/*`; admin UI 404
2. **SQLite schema** — `users.active` missing on old `emcap-local.db`
3. **Web build** — `FormMetadata` import missing in `entity.component.ts`
4. **Ruff** — E501 in access, integrations, metadata builder (fixed)
5. **Docker noise** — `stop-emcap.bat` errors when Docker not installed
6. **401 bursts** — expired JWT in browser (expected until re-login)

## Fixes applied
- `entity.component.ts` — import `FormMetadata`
- `database.py` — `_apply_sqlite_schema_patches()` for local SQLite
- `stop-emcap.bat` — skip docker when not on PATH
- Ruff line-length fixes; web `npm run build` passes
- Restarted API: 13 admin routes, `admin/users` 200

## Verification
- `npm run build` — success (bundle budget warning only)
- `python -m ruff check src` — clean
- Live API admin/users 200 with admin token
