# EMCAP — Flutter test session handoff (2026-06-19)

**Superseded by:** `docs/dev/HANDOFF-continue-standard-product.md` (2026-06-22 verify snapshot).  
**Still valid:** harness patterns and PATH notes below.

## Goal

Unblock P18-T13 / P20-T08: `flutter test --coverage` green at ≥80%, close Partial backlog items, no commit before review.

## User preferences (memorize)

- **No background multi-agents** for Flutter — fix **one test file at a time** in foreground
- Flutter SDK: `C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin` (see `docs/dev/local-environment.md`)
- Agent shells may NOT inherit PATH — prepend Flutter bin before every `flutter` command
- Do not commit before user review

## Root causes learned (apply every Flutter widget test)

### 1. Never `pumpAndSettle` on entity/settings/workflow screens

Use `clients/mobile/test/support/screen_test_harness.dart`:
- `settleEntityScreen`, `settleSettingsScreen`, `settleWorkflowInbox`
- `pumpUntilFound`, `pumpUntilAbsent`

### 2. Mock `EmcapClient` must stub `getPlatformConfig()`

`EntityRecordScreen._loadForm()` calls it. Without override → HTTP 400 in tests → create screen never loads.

### 3. After Navigator.push, don't rely on `settleEntityScreen` alone

List route stays under record route; both have `a11y.landmark.main`. Use `pumpUntilFound` for the pushed screen anchor.

## Outcome (2026-06-22)

- Full suite **526/526** pass; line coverage **85.43%**
- M2 mobile PNG pack captured (7 core + P25 partial)
- Pitfalls: `docs/dev/known-pitfalls.md` § Flutter widget test

## Verify commands

```powershell
$env:Path = "C:\Users\u1074139\flutter\flutter_windows_3.44.2-stable\flutter\bin;" + $env:Path
cd c:\Users\u1074139\workstation\Study\SDD\clients\mobile
flutter test --coverage
python ../../scripts/check-flutter-coverage.py --lcov coverage/lcov.info --min 80
```
