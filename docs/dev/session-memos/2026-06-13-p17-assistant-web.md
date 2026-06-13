# P17-T09 — Assistant polish (web)

**Date:** 2026-06-13  
**Task:** EMCAP-P17-T09

## Goal

Replace thin assistant textarea with product chat UX when `ai.enabled`; disabled empty state when off.

## What changed

| Path | Change |
|------|--------|
| `clients/web/src/app/pages/assistant/assistant.component.*` | Page header, loading/error/disabled, chat bubbles, suggestions, input bar |
| `clients/web/src/app/api/emcap-client.ts` | `aiChat` sends `prompt` (API contract) |
| `clients/web/src/assets/i18n/{en,fr,bn}.json` | Assistant chat strings |
| `spec/sdd/07-product-readiness-matrix.md` | Assistant → Demo (web Done) |
| `plan/03-task-backlog.md` | P17-T09 Done |

## Verification

```bat
cd clients\web && npm run test:ci -- --include=**/assistant*.spec.ts
cd clients\web && npm run build
```

## Open follow-ups

- P17-T10 screenshot pack
- Mobile assistant parity (matrix N/A until mobile route exists)
