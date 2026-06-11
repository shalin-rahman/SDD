# Flutter mobile client

Metadata-driven UI shell aligned with **SDD §9**. Parity with the web client for end-user flows (Phase 8).

## Structure

| Path | Role |
|------|------|
| `lib/main.dart` | App entry; `EMCAP_API_URL` dart-define |
| `lib/theme.dart` | White-label `ThemeData` seed (`EmcapTheme`) |
| `lib/api/emcap_client.dart` | HTTP client (auth, CRUD, platform services) |
| `lib/app/shell.dart` | Login (OAuth), tenant picker, navigation rail |
| `lib/app/entity_screen.dart` | Full entity UX (edit/delete/search/grid/form) |
| `lib/app/assistant_screen.dart` | AI chat (flag gated) |
| `lib/app/account_screen.dart` | MFA, permissions, REST dispatch, payments |
| `lib/app/notification_screen.dart` | Multi-channel notifications |
| `lib/app/report_screen.dart` | Reports + run history |
| `lib/metadata_contract.dart` | Form/grid renderers + validators |
| `test/metadata_contract_test.dart` | Renderer contract tests |

## Capabilities (Phases 7–8)

| Area | Features |
|------|----------|
| Entity CRUD | Create, edit, delete, search, pagination |
| Dynamic forms | Field types, validation, conditions, i18n |
| Dynamic grids | Sort, filter, group, CSV/excel/PDF export (clipboard) |
| Workflow | Inbox actions, start from record, due_at display |
| Platform | Notifications, dashboards, reports + history |
| Identity | MFA, OAuth, tenant picker, white-label theme |
| Documents | Upload, preview, versions |
| Integrations | REST dispatch, payments demo, AI assistant |

## Setup and quality

```bash
cd clients/mobile
flutter pub get
flutter analyze
flutter test
flutter test --coverage   # optional
```

CI runs `flutter analyze` + `flutter test` on every PR.

## Run

```bash
flutter run --dart-define=EMCAP_API_URL=http://localhost:8000
# Android emulator: http://10.0.2.2:8000
```

Default credentials: `admin` / `admin123`.

See `plan/04-client-api-completion.md` for API mapping and web parity notes.
