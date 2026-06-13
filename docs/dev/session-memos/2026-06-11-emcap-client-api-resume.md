# EMCAP client API completion — resume

## Goal

Wire remaining client features (workflow inbox, documents, sync delta, SSE) into web/mobile shells.

## What changed

- **Web client:** `listDocuments`, `syncChanges`, `subscribeRecordsStream` in `emcap-client.ts`
- **Web shell:** workflow tasks view, clickable rows → notes/documents panel, SSE grid refresh when `grid.realtime`, offline change count
- **Mobile client:** `listDocuments`, `syncChanges` in `emcap_client.dart`
- **Mobile shell:** `WorkflowInboxScreen`, Tasks rail item, record tap → notes/documents, offline change count
- **Docs:** `plan/04-client-api-completion.md` API-to-client mapping updated

## Prior session fix

- `sync/service.py` — UTC normalization for naive timestamps in `changes` filter

## Verification (run locally)

```powershell
cd platform/api; python -m pytest -q
cd clients/web; npm run lint; npm test
```

## Constraints

- No git commit (user review pending)
- SSE wired on web only (EventSource/fetch stream; mobile uses pull refresh)

## Open follow-ups

- LOW_STOCK report UI (API ready)
- Mobile SSE if needed
- Full-stack smoke: docker compose + web :4200
