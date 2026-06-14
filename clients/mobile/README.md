# Flutter mobile client

Metadata-driven UI shell aligned with **SDD §9**. Parity with the web client for end-user flows (Phase 8) and Phase 12D enterprise shell/admin.

## Structure

| Path | Role |
|------|------|
| `lib/main.dart` | App entry; theme/locale persisted; loads i18n bundles |
| `lib/theme.dart` | `EmcapTheme` (seed color, dark/light/system) |
| `lib/api/emcap_client.dart` | HTTP client (auth, CRUD, admin API, platform services) |
| `lib/services/preferences_service.dart` | Persists `emcap-theme` / `emcap-locale` (web parity) |
| `lib/services/i18n_service.dart` | JSON bundles (`assets/i18n/en|fr|bn.json`) + `EmcapLocale.t()` |
| `lib/utils/shell_nav_util.dart` | Module-grouped nav, permission filter, admin links |
| `lib/widgets/` | `master_detail_layout`, `permission_picker`, `settings_toggle_group`, `detail_placeholder` |
| `lib/app/shell.dart` | Login, drawer/rail shell, theme/locale toolbar, tenant picker |
| `lib/app/entity_list_screen.dart` | Entity grid list (full-screen); row tap / New → push record screen |
| `lib/app/entity_record_screen.dart` | Entity record/create/edit (full-screen); back pops to list |
| `lib/app/admin_*_screen.dart` | Users, roles, permissions admin (master–detail + checkbox permissions) |
| `lib/app/settings_screen.dart` | Settings hub (module/auth/grid toggles, templates, audit) |
| `lib/metadata_contract.dart` | Form/grid renderers + validators |
| `test/` | Metadata contract, shell nav, permission util tests |

## Phase 12D capabilities

| Area | Features |
|------|----------|
| Shell | Module-grouped drawer (phone) / rail (tablet), permission-filtered menus, Admin/Settings routes |
| Theme / i18n | Light/dark toggle, **EN/FR/BN** locale; persisted via `shared_preferences` |
| Entity | Separate list + record screens (P15-T17); push navigation; form fields from metadata only |
| Admin | User CRUD with role multi-select; role CRUD with checkbox permission picker |
| Settings | Module/auth/notifications/grid/workflow/rules/payments/AI/audit toggles; email templates CRUD; admin audit list |

## Setup and quality

```bash
cd clients/mobile
flutter pub get
flutter analyze
flutter test
```

CI runs `flutter analyze` + `flutter test` on every PR (when Flutter SDK is available).

## Run

```bash
flutter run --dart-define=EMCAP_API_URL=http://localhost:8000
# Android emulator: http://10.0.2.2:8000
```

Default credentials: `admin` / `admin123`.

See `plan/12-enterprise-product-ui.md` (Phase 12D) and `plan/04-client-api-completion.md` for API mapping.
