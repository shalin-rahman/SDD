# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-17 (Sprint 7 — P18-T11/T12/T14 Done)  
**Backlog:** **333 Done / 0 Pending / 10 Partial** (343 total) — `plan/03-task-backlog.md`  
**Do not commit** unless user explicitly asks.

---

## Current focus

1. **CC-1** — M2 mobile PNG pack (P15-T13, P20-T03) — **blocked** (Flutter SDK)
2. **P20-T08** — Matrix 07 M2/M3 mobile sign-off when PNG lands
3. **P18-T13** — mobile bulk `dart test` verify when SDK available

---

## Sprint 7 Done

| Task | Deliverable |
|------|-------------|
| **P18-T14** | `ci.yml` → `e2e-smoke-optional` (PR, non-blocking); weekly `e2e-smoke.yml` authoritative; recipe gate policy |
| **P18-T12** | i18n: lookup picker/field, tenant select, mobile admin bodies; `scripts/audit-i18n.mjs`; `admin_i18n_strings_test.dart`; Karma lookup spec |
| **P18-T11** | `phase18-login-web.png`, `phase18-account-auth-web.png` via `--only=login-auth` |
| **Mobile i18n** | `admin_users_screen`, `admin_roles_screen`, `admin_permissions_screen`, `settings_screen`, `shell`, `permission_picker`, `master_detail_layout` |

---

## Still Partial (10)

| Blocker | Tasks |
|---------|-------|
| **Flutter SDK + PNG** | P15-T13, P20-T03, P18-T06/T09/T10/T16/T17/T18/T20 |
| **dart test verify** | P18-T13 |
| **Matrix ongoing** | P20-T08 (M2/M3 mobile sign-off) |

---

## Verify

```bat
cd clients\web && npm run build && npm run test:ci
cd platform\api && python -m pytest tests/test_entity_system_contract.py tests/test_inventory_product_smoke.py tests/test_migrations.py tests/test_module_report_menus.py -q
cd clients\mobile && dart test
node scripts/e2e-smoke.mjs
node scripts/audit-i18n.mjs
```

**Last verify (Sprint 7):** Karma **437/437**; API pytest **93**; `flutter test` not run locally.

---

## Suggested prompt (new chat)

> Continue EMCAP from HANDOFF. Blocked: flutter test + M2 mobile PNG. Next: P18-T13 dart verify, CC-1 when SDK available. No commit before review.
