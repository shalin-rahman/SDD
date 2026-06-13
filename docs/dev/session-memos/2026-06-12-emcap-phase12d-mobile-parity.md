# EMCAP Phase 12D mobile parity

## Goal
Apply all Phase 12 enterprise UI feedback to the Flutter mobile client (module nav, master-detail, theme/i18n, admin CRUD with permission picker, settings hub).

## Constraints
- Do not commit until user review.

## What changed
- `clients/mobile/lib/utils/shell_nav_util.dart` — module grouping, permission filter, admin/settings links
- `clients/mobile/lib/utils/permission_util.dart` — toggle helpers + role summary
- `clients/mobile/lib/widgets/` — master_detail_layout, permission_picker, settings_toggle_group, detail_placeholder
- `clients/mobile/lib/api/emcap_client.dart` — full admin CRUD API parity with web
- `clients/mobile/lib/app/shell.dart` — drawer/rail, theme/locale, grouped nav, settings nav refresh
- `clients/mobile/lib/app/entity_screen.dart` — master-detail list vs detail/edit panes
- `clients/mobile/lib/app/admin_*_screen.dart` — users/roles CRUD + checkbox permissions
- `clients/mobile/lib/app/settings_screen.dart` — toggles, templates MD, audit
- `clients/mobile/lib/main.dart`, `theme.dart`, `pubspec.yaml` — dark theme + flutter_localizations
- `clients/mobile/test/shell_nav_util_test.dart`, `permission_util_test.dart`
- Docs: `clients/mobile/README.md`, `06-admin-product-ui-matrix.md`, `plan/03-task-backlog.md`, `docs/dev/codebase-index.md`

## Verification
- Flutter SDK **not available** in agent environment (`flutter` not on PATH).
- Run locally:
  ```bat
  cd clients\mobile
  flutter pub get
  flutter analyze
  flutter test
  ```

## Open follow-ups
- Theme/locale not persisted to device storage (session-only ValueNotifier)
- Full i18n bundles (most strings still English)
- Payment gateway secrets UI, integrations registry, row/field security viewer (same gaps as web)
- Rail navigation does not show module group headers (drawer does)
