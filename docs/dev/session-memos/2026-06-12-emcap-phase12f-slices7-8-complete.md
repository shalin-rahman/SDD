# Phase 12F Slices 7–8 — Rail headers + doc sync

## Goal
P12F-T50–T53 (mobile rail module headers) + Slice 8 (matrix rev. 6, traceability, i18n tail).

## Slice 7
- `buildRailNavSlots` / `RailNavSlot` in `shell_nav_util.dart`
- Custom tablet rail in `shell.dart` with module header labels before entity icons
- Drawer unchanged on narrow screens
- Test: `shell_nav_util_test.dart` rail header test

## Slice 8
- `06-admin-product-ui-matrix.md` rev. 6 (12F outcomes)
- `03-traceability-matrix.md` Phase 12F rows (FR-007, FR-014, FR-015, FR-002 viewer, rail)
- Settings panel titles → i18n (`settings.sections.*`)
- Backlog: T50, T12, P12E-T01/T02 Done; plan 12F marked complete
- `enterprise-ui-shell.md` Phase 12F smoke table

## Verification
```powershell
cd clients/mobile
flutter test test/shell_nav_util_test.dart
```

## Open follow-ups (Phase 13 / backlog)
- Platform page i18n (workflow, account body strings)
- ABAC policy editor
- Matrix Partial rows (grid grouping, report schedule, etc.)
