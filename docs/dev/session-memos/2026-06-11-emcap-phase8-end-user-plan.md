# EMCAP Phase 8 end-user product plan

## Goal
Close end-user UX gaps vs `spec/framework-sdd.txt` §9. Backlog **108 → 131** tasks (23 new).

## Decisions
- **FR-008c** — §9 end-user UX depth requirement added.
- **05-end-user-matrix.md** — UX status source (separate from Phase 7 service matrix).
- **ADR-004** — deepen Vite/Flutter shells; no full Angular rewrite in Phase 8.
- CRM as second module (`modules/crm/`); other domains deferred.

## Artifacts created
| Path | Purpose |
|------|---------|
| `spec/sdd/05-end-user-matrix.md` | End-user flow status |
| `plan/07-phase8-end-user-product.md` | Playbook P8-T01–T23 |
| `spec/sdd/adrs/004-phase8-end-user-product.md` | ADR |
| `docs/dev/recipes/add-record-edit-ui.md` (+ 7 recipes) | Implementation guides |

## Waves
1. Edit/delete/search/pagination
2. Validation, i18n, grid features
3. MFA, OAuth, SaaS themes
4. Documents, workflow, reports, channels, AI
5. CRM, contract tests, prod sign-off

## Start implementation
**P8-T03** — `docs/dev/recipes/add-record-edit-ui.md`

## Constraints
- No commit before user review.
- Business modules in `modules/` only.

## Open follow-ups
- Phase 7 uncommitted diff still pending user review
- Full Angular app remains out of scope
