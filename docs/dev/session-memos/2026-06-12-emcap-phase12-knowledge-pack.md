# EMCAP Phase 12 — knowledge pack

## Goal
Consolidate skills, recipes, pitfalls, and docs so Phase 12 implementation does not repeat earlier gaps (bare UI marked Done, flat nav, no admin).

## What was added/updated

### New skill
- `.cursor/skills/emcap-enterprise-ui/SKILL.md` — FR-008d patterns, architecture, anti-patterns, verify steps

### Updated skills
- `emcap-codebase-map` — Phase 12 entry point, matrix meanings
- `emcap-identity-authz` — admin API targets, seed permissions
- `emcap-dynamic-ui` — master–detail + sidenav pointers
- `emcap-config` — settings UI key whitelist
- `emcap-testing` — Phase 12 test files + DoD

### Recipes
- `docs/dev/recipes/enterprise-ui-shell.md` — P12A step-by-step
- `docs/dev/recipes/add-admin-api-and-ui.md` — P12B–C API + screens
- `docs/dev/recipes/add-client-api-method.md` — fixed paths + matrix 06 step

### Pitfalls
- `docs/dev/known-pitfalls.md` — Phase 12 section (10 items)

### Index / backlog
- `docs/dev/codebase-index.md` — Phase 12 paths
- `plan/03-task-backlog.md` — 56 tasks (1 Done: P12E-T07)
- `README.md` — Phase 12 doc links

### Already existed (prior session)
- `plan/12-enterprise-product-ui.md` — full SDD crosswalk
- `plan/12-phase12-dod-checklist.md` — PR gate
- `spec/sdd/06-admin-product-ui-matrix.md` — honest gap
- `spec/sdd/01-requirements.md` — FR-008d
- `.cursor/rules/emcap-sdd-workflow.mdc` — Phase 12 workflow

## Agent read order for Phase 12

1. `emcap-enterprise-ui` skill
2. `plan/12-phase12-dod-checklist.md`
3. Task-specific recipe
4. `known-pitfalls.md` Phase 12

## Open follow-ups
- Implement P12A-T01–T04 (first code PR)
- Mark P12E-T03, T05, T06 Done after this knowledge pack review
