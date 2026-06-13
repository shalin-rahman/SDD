# P17-T11 — Rule evaluate product panel (web)

**Date:** 2026-06-14  
**Task:** EMCAP-P17-T11  
**Feedback:** H (gap task — rule demo off Account)

## Goal

Relocate workflow rule evaluate from Account dev surface to a product panel under Settings → Rules.

## What changed

| Path | Change |
|------|--------|
| `clients/web/src/app/pages/settings/rule-evaluate.component.*` | New panel: expression, optional context JSON, Evaluate, result card |
| `clients/web/src/app/app.routes.ts` | Route `/app/settings/rules` with `settingsGuard` |
| `clients/web/src/app/pages/settings/settings.component.html` | Link from Rules expansion panel |
| `clients/web/src/assets/i18n/{en,fr,bn}.json` | `settings.rules.evaluate.*` keys |
| `spec/sdd/07-product-readiness-matrix.md` | Rule evaluate → Demo, P17-T11 Done |
| `plan/03-task-backlog.md` | EMCAP-P17-T11 Done |
| `docs/dev/codebase-index.md` | Settings path + spec file |

## Route

`/app/settings/rules` — reachable from Settings → Rules → “Open rule evaluate panel”.

## Verification

```bat
cd clients\web && npm run test:ci && npm run build
```

**2026-06-14:** 65/65 tests pass; production build OK.

## Open follow-ups

- P17-T10 screenshot pack may include rule evaluate panel
- Mobile parity not in scope for T11
