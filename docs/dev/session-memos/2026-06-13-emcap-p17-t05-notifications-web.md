# P17-T05 — Notification center (web)

**Date:** 2026-06-13  
**Task:** EMCAP-P17-T05  
**Scope:** Web Angular only

## Goal

Product notification center with read/unread styling, channel icons, all/unread filter, loading/error/empty states, i18n EN/FR/BN.

## Decisions

- **Mark-read:** No API endpoint; client-side `localStorage` key `emcap.notifications.readIds` on open/detail.
- **Read/unread:** All API rows start unread until opened; filter hides read rows when "Unread" selected.
- **Send form removed:** Dev send UI replaced by inbox-only product UX (matches workflow/reports pattern).
- **Platform tweak:** `NotificationHub.list_sent` now includes `created_at` ISO timestamp for list display.

## Changed

| Path | Change |
|------|--------|
| `clients/web/src/app/pages/notifications/` | Component + html/scss/spec |
| `clients/web/src/assets/i18n/{en,fr,bn}.json` | Notification center strings |
| `platform/api/src/emcap/notifications/hub.py` | `created_at` in list response |
| `spec/sdd/07-product-readiness-matrix.md` | Notifications → Demo |
| `plan/03-task-backlog.md` | P17-T05 Done, counts 221/298 |
| `docs/dev/codebase-index.md` | Notifications page path |
| `docs/dev/HANDOFF-continue-viable-product.md` | S7 next = doc preview |

## Verification

```bat
cd clients\web
npm run test:ci -- --include=**/notifications.component.spec.ts
npm run build
```

## API gaps

- No `PATCH /notifications/{id}/read` — read state is browser-local only.
- List does not return `body`; detail panel shows metadata only.
- API `status` is delivery status (`sent`), not read/unread.

## Follow-ups

- P17-T06 document preview web
- Mobile notification center parity (no P17 task id for mobile-only; matrix N/A until scoped)
