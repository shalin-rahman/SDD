# ADR-002: In-repo agent memory and implementation recipes

## Status

Accepted — 2026-06-11

## Context

Agents re-explored the monorepo each session. Fixes (sync datetime, SSE auth, Dart metadata parity) lived only in chat or external task summaries. SDD traceability stopped at Phase 5 while client shell work continued informally.

## Decision

1. **Canonical knowledge in-repo** under `docs/dev/`:
   - `codebase-index.md` — file lookup
   - `known-pitfalls.md` — error registry with linked tests
   - `recipes/` — step-by-step implementation checklists
   - `recall-index.md` — session memo index (`docs/dev/session-memos/`)

2. **Cursor integration** — `emcap-sdd-workflow.mdc` (always apply) and `emcap-codebase-map` skill direct agents to read index/pitfalls before searching.

3. **Regression rule** — each pitfall entry must reference a pytest or vitest guard.

4. **Session memos** (`docs/dev/session-memos/`) — handoff summaries; link to canonical `plan/` / `spec/` docs. Index: `docs/dev/recall-index.md`.

## Consequences

- Faster implementation with less exploration.
- Phase 6 formalized in backlog (P6-T01–T07).
- Agents and humans share the same runbooks.

## References

- `plan/05-phase6-playbook.md`
- `spec/sdd/03-traceability-matrix.md` Phase 6 section
