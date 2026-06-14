# Entity UX pivot — doc correction (C16 rejected)

**Date:** 2026-06-14  
**Trigger:** User clarified — **separated list/entry pages only**; grid columns must **not** be forced onto entry form.

## Decision

| Requirement | Status |
|-------------|--------|
| C15 — separate list + record routes | **Keep** — P15-T15 (web Partial), P15-T17 (mobile Pending) |
| C16 — grid columns on entry form | **Rejected** — P15-T16 **Cancelled** |

## Docs updated

- `docs/product/user-feedback-registry.md` — §C, §F, §I
- `plan/15-entity-page-redesign.md` — Slice 15C scope
- `plan/03-task-backlog.md` — P15-T16 Cancelled; phase counts
- `plan/16-standard-viable-system.md` — entity UX bar
- `spec/sdd/07-product-readiness-matrix.md` — pivot notice, 15C gate
- `.cursor/skills/emcap-enterprise-ui/SKILL.md`

## Open

- Re-capture list-only + record-only screenshots (P15-T15)
- Mobile separate nav (P15-T17)
- Remove any grid-form-parity code/tests if landed from interim work (optional cleanup)
