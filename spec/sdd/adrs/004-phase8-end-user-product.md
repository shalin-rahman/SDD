# ADR-004: Phase 8 end-user product depth

## Status

Accepted — 2026-06-11 · Implemented — 2026-06-11 (131/131 backlog Done)

## Context

Phase 7 closed platform-service wiring in thin shells (`spec/sdd/04-capability-matrix.md`). End users still cannot edit/delete records, search, use rich form/grid features, MFA, full SaaS branding, or second business modules — gaps identified against `spec/framework-sdd.txt` §9 and §27.

## Decision

1. **Phase 8** formalizes 23 tasks (P8-T01–T23) in `plan/07-phase8-end-user-product.md`.
2. **End-user matrix** (`spec/sdd/05-end-user-matrix.md`) is the status source for UX depth; distinct from Phase 7 service matrix.
3. **Requirement FR-008c** captures §9 end-user UX parity (edit/delete, validation, grid features, auth flows).
4. **No new platform core for business logic** — renderers and shells only; CRM via `modules/crm/` per FR-018.
5. **Stubs remain flag-gated** — AI, payments, optional channels follow `config/platform.yaml`.
6. **Renderer contract tests** mandatory before marking form/grid tasks Done.

## Consequences

- Backlog grew 108 → 131 tasks; all Phase 8 tasks Done (2026-06-11).
- Agents read `05-end-user-matrix.md` + playbook before UX work.
- Full Angular framework replacement deferred here; completed in ADR-005 (Phase 10).

## References

- `spec/sdd/05-end-user-matrix.md`
- `plan/07-phase8-end-user-product.md`
- ADR-003 (Phase 7 gap closure)
