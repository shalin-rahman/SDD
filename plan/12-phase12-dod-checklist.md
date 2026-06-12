# Phase 12 — Definition of Done checklist

Use this **before** marking any `EMCAP-P12*` task **Done** or updating a matrix row to **Done**.

Copy into PR description; check all that apply.

---

## 1. Scope & architecture

- [ ] Business logic remains in `modules/`; admin/settings APIs in `platform/api` only
- [ ] Feature flags read from `GET /config/platform`; UI hidden when subsystem disabled
- [ ] No secrets in GET responses (masked placeholders only)
- [ ] SDD § mapped in PR (table row or task ID)

---

## 2. Web UI (required for UI tasks)

- [ ] Screen reachable from shell nav (not buried on Account demo page)
- [ ] Responsive at 375px, 768px, 1280px widths
- [ ] Loading and error states shown (not blank page)
- [ ] Permission guard: unauthorized users redirected or see 403 message
- [ ] i18n: no new hard-coded user-visible strings without translation key
- [ ] Theme: works in light and dark mode

---

## 3. API (required for backend tasks)

- [ ] OpenAPI route under `/api/v1/admin/*` or documented settings path
- [ ] RBAC: requires appropriate `admin.*` or scoped permission
- [ ] Validation errors return 422 with field detail
- [ ] Settings changes write audit entry (P12C-T06 when API exists)
- [ ] pytest covers happy path + auth denial + validation failure

---

## 4. Client contract & parity

- [ ] New client method added to `emcap-client.ts` **and** `emcap_client.dart` (or N/A with matrix note)
- [ ] Method listed in `REQUIRED_METHODS` / contract test
- [ ] Karma or vitest test for non-trivial UI logic

---

## 5. Data & local dev

- [ ] Seed data updated if new permissions/roles/templates needed (`data/seed/core/`)
- [ ] `config/platform-test.yaml` unchanged or demo still off for pytest
- [ ] `scripts/run-emcap.bat --local` smoke step documented in PR

---

## 6. Documentation (same PR — mandatory)

Use recipe: `docs/dev/recipes/sync-docs-after-change.md` · Rule: `.cursor/rules/emcap-doc-sync.mdc`

- [ ] `plan/03-task-backlog.md` task status updated
- [ ] `spec/sdd/06-admin-product-ui-matrix.md` row updated (not only 04/05)
- [ ] `spec/sdd/03-traceability-matrix.md` if new FR coverage
- [ ] `docs/dev/codebase-index.md` if paths, tests, or scripts changed
- [ ] `clients/web/src/app/shared/README.md` if shared components added/changed
- [ ] Matching recipe in `docs/dev/recipes/` + `.cursor/skills/` if steps changed
- [ ] `README.md` if user-facing entry points changed
- [ ] New pitfall + test if fixing recurring error (`known-pitfalls.md`)

---

## 7. Anti-patterns (auto-fail review)

| Fail if… |
|----------|
| Only API exists; no admin/product screen |
| Menu still flat after “module nav” task |
| List and edit on separate routes without master–detail |
| “Done” without manual smoke step executed |
| Account page used as substitute for Admin Users |
| Matrix 04/05 bumped to 100% without 06 updated |
| **Docs not updated in same change as code** |
| New `shared/` component without `shared/README.md` + `codebase-index.md` |
| Windows-only script broken (run from repo root) |

---

## FR-008d acceptance (Phase 12 complete)

Phase 12 is **complete** when `06-admin-product-ui-matrix.md` shows **Done** or **Partial** (with Phase 13 note) for:

- Module-grouped navigation  
- Master–detail entity UX  
- User + role admin consoles  
- Settings hub (modules, notifications, payments minimum)  
- App i18n switcher + theme picker  
- Mobile parity for shell + read-only admin  

Not required for Phase 12 closure: layout designer, full ABAC builder, tenant isolation write.
