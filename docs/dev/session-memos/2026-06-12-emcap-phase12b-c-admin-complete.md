# Phase 12B/C — admin API, settings, theme/i18n

## Goal
Complete remaining Phase 12 core gaps from user feedback: admin users/roles, settings hub, theme/i18n, ≥80% test coverage, doc sync.

## Constraints
- No git commit before user review
- Business logic stays in platform admin domain (not `modules/`)

## What changed
- **Backend:** `platform/api/src/emcap/admin/*`, `api/routes/admin.py` — users, roles, settings overrides, notification templates, admin audit
- **DB:** `UserRow.active`, `SettingOverrideRow`, `NotificationTemplateRow`, `AdminAuditRow`
- **Seed:** `admin.*` on admin role in `data/seed/core/roles.json`
- **Web:** `pages/admin/*`, `pages/settings/*`, `ThemeService`, `I18nService`, toolbar controls, `admin.guard.ts`, client admin methods
- **Tests:** `test_admin_api.py`, theme/i18n/export specs, shell-nav admin link tests
- **Docs:** backlog, traceability, matrix 06, codebase-index, shared README

## Verification
```bat
cd platform\api && python -m pytest -q --cov=src --cov-fail-under=80
cd clients\web && npm run build && npm run test:ci
```
- Backend: 76 passed, **87%** total coverage
- Web: **20/20** Karma, build OK

## Open follow-ups
- P12C: payments, grid flags, integrations, workflow/rules toggles UI (settings sections)
- P12D: mobile parity
- Legacy auth files (`rbac.py`, `security.py`) still below 80% per-file; total gate passes
- Settings overrides stored in DB but runtime still reads YAML until reload hook (Phase 13)
