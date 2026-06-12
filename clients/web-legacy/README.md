# EMCAP web client (archived — Vite thin shell)

**Superseded by** `clients/web/` (Angular CLI 19). Kept for reference during migration; do not extend.

The Vite/TypeScript shell was the Phase 7–9 implementation before ADR-005 adopted full Angular CLI per `spec/framework-sdd.txt` §9.

## Do not use for new work

- CI and docs point to `clients/web/`
- Port any missing behavior into Angular components under `clients/web/src/app/pages/`

## Historical verify (archived stack)

```bash
cd clients/web-legacy
npm ci
npm run lint
npm test
```
