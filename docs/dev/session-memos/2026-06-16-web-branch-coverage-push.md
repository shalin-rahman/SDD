# Session memo — Web Karma branch coverage push (Sprint 14)

**Date:** 2026-06-16  
**Goal:** Raise web Karma **branch** coverage from ~62% to ≥80% (NFR-003).

## Outcome

| Metric | Before | After |
|--------|--------|-------|
| Branch coverage | ~62% | **80.57%** (954/1184) |
| Karma specs | ~302 | **406** |
| `karma.conf.js` branch gate | 55% | **80%** |
| API pytest | ~91% | ~91% (unchanged gate) |
| Flutter CI | — | **80%** via `check-flutter-coverage.py` |

Verify: `cd clients/web && npm run test:coverage`

## Canonical docs (prefer over this memo)

- Recipe: `docs/dev/recipes/add-coverage-gate.md` — strategy + verify commands
- Pitfalls: `docs/dev/known-pitfalls.md` § **NFR-003 — Web Karma branch coverage**
- Skill: `.cursor/skills/emcap-testing/SKILL.md`
- Index: `docs/dev/codebase-index.md` — spec paths + gates footer

## Coverage strategy

1. Extend existing `*.spec.ts` in high-branch files (entity-record, settings, workflow, entity-list, admin-security, reports, utils).
2. Invoke **public** component methods to hit both sides of conditionals.
3. Utils (`document-preview.util`, `workflow-sla.util`, `permission.util`, `export.util`) give high branch ROI.

## Recurring spec mistakes (see pitfalls for full table)

| Mistake | Fix |
|---------|-----|
| `onPaymentChange` before `applyPaymentCredentials` | Use `selectPaymentProvider('stripe')` |
| Mutate `formValues` before `restoreRecord` completes | `await fixture.whenStable()` |
| Router only has list route | Add `app/entity/:code/:recordId` |
| Expect `'No schedule'` in reports | i18n renders **Manual only** |
| Spy `exportUtil.downloadCsv` | Assert `historyError` / `isDownloading` |
| SLA label empty | Instance needs `due_at` |
| `equals` + `value: true` | Use `{ flag: true }` not `'yes'` |
| 25 records → 2 pages | `DEFAULT_PAGE_SIZE=10` → **3** pages |
| `listAdminRoles` reject then `selectRole` | Call `reload()`; `BehaviorSubject` for `isMobile$` |
| Label fallback with `label: ''` | Use `undefined` (`??` not nullish on `''`) |
| `canPostMovement()` false | Set `STOCK_MOVEMENT`, `draft`, `selectedRecordId`, `creatingNew=false` |
| Integration status `'missing'` | Use `'not_configured'` |

## Open follow-ups

- Local Flutter verify for mobile 80% gate (CI only today)
- M2 mobile PNG (unchanged blocker)
