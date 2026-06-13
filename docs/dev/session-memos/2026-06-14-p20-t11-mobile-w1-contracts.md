# P20-T11 — W1 mobile entity contracts + If-Match

**Date:** 2026-06-14  
**Task:** EMCAP-P20-T11 · `plan/20-standard-entity-rollout.md` §3  
**Depends:** P20-T09 (API module fields) — mobile tests skip entities without fixtures

## Delivered

| Path | Purpose |
|------|---------|
| `clients/mobile/test/support/entity_fixtures.dart` | Generic loader for `platform/api/tests/fixtures/metadata/{entity}.*.json` |
| `clients/mobile/test/entity_system_contract_test.dart` | W1 parametrized fixture contract (PRODUCT + CUSTOMER active; others skip) |
| `clients/mobile/test/record_headline_test.dart` | Headline util unit tests |
| `clients/mobile/lib/utils/record_headline.dart` | Metadata-driven hero headline (web `record-headline.util` parity) |
| `clients/mobile/lib/api/emcap_client.dart` | `updateRecord(..., ifMatch:)` sends `If-Match` header |
| `clients/mobile/lib/app/entity_screen.dart` | Uses `record_headline.dart`; passes `record_version` on PUT |
| `clients/mobile/assets/i18n/{fr,bn}.json` | Headline/status fallback keys aligned with en |

## Verification

```powershell
cd clients\mobile
flutter test test/entity_system_contract_test.dart test/record_headline_test.dart
```

**Blocked locally:** Flutter SDK not on PATH — code + tests written; `flutter run` / device verify deferred.

## Open follow-ups

- API fixtures for WAREHOUSE, LEAD, CONTACT → un-skip mobile contract tests
- P20-T09 module fields + P20-T10 web fixture parity
- M2 screenshot capture (P15-T13 / P20-T03) when Flutter available
