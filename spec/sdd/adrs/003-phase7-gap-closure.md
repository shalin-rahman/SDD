# ADR-003: Phase 7 SDD gap closure approach

## Status

Accepted — 2026-06-11

## Context

Phases 0–6 delivered platform API services and thin client shells. SDD §2 requires reusable services across API, web, and mobile. `spec/sdd/04-capability-matrix.md` identified **Partial** and **No** rows not covered by Phase 6.

## Decision

1. **Phase 7** formalizes 16 tasks (P7-T01–T16) in `plan/06-sdd-gap-closure.md`.
2. **Capability matrix** is the single status source; update on every P7 merge.
3. **Recipes + pitfalls** extended for each new UI type; contract tests mandatory for client methods.
4. **Payments/integrations** remain stub at API until enabled in config; UI is flag-gated.
5. **NFR items** (coverage, production readiness) are explicit tasks, not implicit.

## Consequences

- Backlog grows 92 → 108 tasks; current focus shifts to Phase 7.
- Agents read matrix + playbook before implementation (no ad-hoc exploration).
- Full SDD §2 end-to-end parity is achievable without new platform core changes for business features.

## References

- `spec/sdd/04-capability-matrix.md`
- `plan/06-sdd-gap-closure.md`
- ADR-002 (agent memory)
