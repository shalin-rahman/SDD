# ADR-005: Angular CLI web client

## Status

Accepted — 2026-06-11 · Implemented — 2026-06-11

## Context

`spec/framework-sdd.txt` §9 names **Angular** as the web presentation stack. Phases 7–9 delivered a **Vite/TypeScript thin shell** (ADR-004 deferred full Angular). Phase 10 migrates to a **full Angular CLI 19** app with feature parity.

## Decision

1. **`clients/web/`** is the canonical Angular CLI application (`ng serve`, `ng build`, `ng test`).
2. **`clients/web-legacy/`** archives the Vite shell; no further changes.
3. **Metadata contract** remains shared semantics with Flutter (`metadata/contract.ts`, renderer classes).
4. **API client** stays a TypeScript class (`api/emcap-client.ts`) wrapped by `EmcapApiService` — not replaced by HttpClient for SSE and minimal migration risk.
5. **TypeScript** `noPropertyAccessFromIndexSignature: false` in `tsconfig.json` — platform payloads use `Record<string, unknown>`; bracket access everywhere is noise.

## Consequences

- CI runs `npm run build` + `npm run test:ci` (Karma + ChromeHeadless).
- Skills, recipes, and `frontend-angular.mdc` describe Angular CLI paths.
- NFR-004 “Angular coverage” satisfied via Karma contract tests.

## Migration pitfalls (learned)

| Issue | Fix |
|-------|-----|
| `npx ng new` ENOENT on `%APPDATA%\npm` | `New-Item -Force $env:APPDATA\npm` before `npx` |
| `readable-stream` missing during `ng new` | Re-run `npm install` in `clients/web` after partial scaffold |
| TS4111 index signature on `Record<>` | `noPropertyAccessFromIndexSignature: false` |
| Karma hangs locally | Use `npm run test:ci` (headless, no watch) |

## References

- `plan/10-angular-cli-web.md`
- ADR-004 (Phase 8 Vite deferral)
- `clients/web/README.md`
