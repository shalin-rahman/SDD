# P17-T01 — Workflow inbox web UX

**Date:** 2026-06-13  
**Task:** EMCAP-P17-T01  
**Blocked prior:** S2/M2 needs Flutter for mobile screenshots

## Goal

Replace thin workflow table + `alert`/`prompt` with product UX using shared layout components.

## What changed

| Path | Change |
|------|--------|
| `clients/web/src/app/pages/workflow/workflow.component.*` | Page header, filters, SLA badges, table/cards, inline confirm/delegate dialogs, detail section card |
| `clients/web/src/app/shared/utils/workflow-sla.util.ts` | SLA level from `due_at` |
| `clients/web/src/assets/i18n/{en,fr,bn}.json` | Filter, SLA, empty-state strings |
| `spec/sdd/07-product-readiness-matrix.md` | Workflow inbox → Demo (web) |
| `plan/03-task-backlog.md` | P17-T01 Done |

## Verification

```bat
cd clients\web && npm run test:ci -- --include=**/workflow*.spec.ts
cd clients\web && npm run build
```

5 tests passed; build OK (bundle budget warning unchanged).

## Open follow-ups

- P17-T02 mobile workflow inbox
- `phase17-workflow-inbox-web.png` screenshot when stack running
- S2/M2: install Flutter + capture mobile pack
