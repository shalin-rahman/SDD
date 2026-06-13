# EMCAP Phase 12 — Enterprise UI gap & plan

## Goal
User feedback: UI too bare; broken grids; no module menus; no admin/settings; i18n/themes missing. Review `spec/framework-sdd.txt` vs web/mobile; produce honest gap + implementation plan.

## Decisions
- Matrices 04/05 marked "100%" = API + thin CRUD shell, NOT product-grade admin UX.
- New honest matrix: `spec/sdd/06-admin-product-ui-matrix.md`
- Phase 12 playbook: `plan/12-enterprise-product-ui.md` (27 pending tasks in backlog)
- No code implementation this session — planning only; no commit.

## What changed
- `spec/sdd/06-admin-product-ui-matrix.md` (new)
- `plan/12-enterprise-product-ui.md` (new)
- `plan/03-task-backlog.md` — Phase 12 rows, total 174 tasks
- `spec/sdd/04-capability-matrix.md`, `05-end-user-matrix.md` — disclaimers

## Key gaps
- Flat nav ignores `menu.module`; no module on/off UI
- No user/role CRUD API or admin screens
- No settings write API; no email templates
- No app i18n switcher; no theme picker
- Entity page stacked not master–detail; grids not responsive

## Verification
N/A (docs only)

## Open follow-ups
- Start P12A-T01–T04 (Material shell, module nav, master–detail)
- User review → commit Phase 11 work
