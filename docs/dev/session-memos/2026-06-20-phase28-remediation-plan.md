# Phase 28 remediation plan — 2026-06-20

**Canonical:** `plan/28-application-review-remediation.md` · **Status:** Phase 28 **Done** 2026-06-22 (see backlog).

## Goal

Turn application review findings into an executable backlog with **≥80% coverage gates** on every wave.

## Decisions

- New phase **28** (not reopen P25) — finance hardening is post-sign-off quality work
- **FR-030** added for traceability
- Existing P24/P26 tasks kept separate (PDF headers, mobile a11y) — cross-ref only
- No commit before user review

## What changed

- `plan/28-application-review-remediation.md` — 4 waves, sprint sequence, verify commands
- `plan/03-task-backlog.md` — Phase 28 (P28-T01–T14)
- `spec/sdd/01-requirements.md` — FR-030
- `spec/sdd/03-traceability-matrix.md` — Phase 28 section
- `docs/dev/codebase-index.md` — Phase 28 pointer

## Coverage gates (per wave)

| Layer | Gate |
|-------|------|
| API | pytest `--cov-fail-under=80` |
| Web | Karma **80% branches** |
| Mobile | flutter **80% line** via check script |

## Execution order (completed)

1. **W1** P28-T02–T06, T12 (backend validators + void)
2. **W2** P28-T07 (web JE UX) + P28-T13
3. **W3** P28-T08–T11 (mobile parity)
4. **W4** P28-T14 (matrix/backlog doc sync)

## Final verify (2026-06-22)

- Flutter **526/526**; line **85.43%**
- Web Karma **536/536**; branches **81.08%**
- P28 backend entity tests green

## Open follow-ups (post-P28)

- Phase R4 deferred admin/platform depth (`plan/21-standard-product-residual-gaps.md` §Phase R4)
- Optional Demo+ → Product-ready elevation for org branding rows (matrix §19)
- P27-T12 mobile locale-switch device PNG (web Done)
