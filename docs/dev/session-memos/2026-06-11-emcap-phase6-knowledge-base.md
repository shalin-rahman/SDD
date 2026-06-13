# EMCAP Phase 6 — Knowledge base + client completion

## Goal

In-repo agent memory; LOW_STOCK Reports UI; full-stack smoke; SDD doc sync.

## Canonical in-repo (do not duplicate)

- `docs/dev/codebase-index.md`
- `docs/dev/known-pitfalls.md`
- `docs/dev/recipes/`
- `plan/05-phase6-playbook.md`
- `spec/sdd/adrs/002-agent-memory-and-recipes.md`

## What changed

- Agent memory + Cursor rule/skill
- Web/mobile `listReports` / `runReport` + Reports nav
- `scripts/verify-full-stack.{ps1,sh}`
- Traceability Phase 6; backlog 92/92

## Verification

```powershell
python -m pytest -q platform/api/tests   # 58 passed
cd clients/web; npm test
.\scripts\verify-full-stack.ps1
```

## Constraints

- No git commit (user review pending)
