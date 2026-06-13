# Phase 8 remaining — mobile parity + prod readiness

## Completed
- Mobile OAuth login, MFA, tenant picker, white-label theme (`shell.dart`, `main.dart`, `account_screen.dart`)
- Mobile grid sort/filter/group, field types, validation, CSV/excel/PDF export (`entity_screen.dart`)
- Mobile multi-channel notifications, report runs, REST dispatch, AI assistant screen
- Flutter `test/metadata_contract_test.dart`
- CI: `npm test` + `flutter test` in client lint jobs
- `docs/ops/production-readiness.md` tabletop verified
- `spec/sdd/05-end-user-matrix.md` — all actionable rows Done

## Verify
```
60 pytest, 8 vitest passed
flutter test — requires local SDK (CI runs it)
```

## Open
- Physical production sign-off before real cutover
- Layout grid (row/col/span) — future phase
