# Doc sync rule + full doc update

## Goal
User asked: update all docs; make doc sync always mandatory with implementation.

## What was added
- **Rule:** `.cursor/rules/emcap-doc-sync.mdc` (always apply)
- **Recipe:** `docs/dev/recipes/sync-docs-after-change.md`

## What was updated
- `.cursor/rules/emcap-sdd-workflow.mdc`, `emcap-core-standards.mdc`
- `README.md`, `docs/dev/codebase-index.md`
- `plan/12-phase12-dod-checklist.md`, `plan/12-enterprise-product-ui.md`, `plan/03-task-backlog.md`
- `spec/sdd/00-document-control.md`, `03-traceability-matrix.md`, `06-admin-product-ui-matrix.md`
- `docs/dev/recipes/enterprise-ui-shell.md`, `add-admin-api-and-ui.md`, `add-client-api-method.md`
- `docs/dev/known-pitfalls.md` Phase 12 doc gate
- Skills: `emcap-codebase-map`, `emcap-enterprise-ui`, `emcap-testing`
- `clients/web/src/app/shared/README.md`

## Rule summary
Code change without doc update = not Done. Checklist: backlog, correct matrix (06 for admin UI), codebase-index, shared README, recipes, skills, pitfalls.

## Open follow-ups
- P12A-T06–T07 or P12B with doc sync on each PR
