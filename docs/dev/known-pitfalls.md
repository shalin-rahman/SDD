# EMCAP — Known Pitfalls

Error → cause → fix → prevention test. **Check this before debugging.**

**Regression rule:** Any pitfall fix must add or extend a test.

---

## Backend

### Naive vs aware datetime comparison

| | |
|--|--|
| **Error** | `TypeError: can't compare offset-naive and offset-aware datetimes` |
| **Where** | `platform/api/src/emcap/sync/service.py` — `_record_updated_after` |
| **Cause** | DB `created_at`/`updated_at` are naive; `since` query param is UTC-aware |
| **Fix** | After parsing, if `parsed.tzinfo is None`: `parsed = parsed.replace(tzinfo=UTC)` |
| **Test** | `test_client_api_gaps.py::test_offline_sync_snapshot_and_changes` |

### EntityRegistryError in routes

| | |
|--|--|
| **Error** | Unhandled `EntityRegistryError` or wrong `KeyError` catch |
| **Where** | `api/routes/sync.py`, `notes.py` |
| **Fix** | `except EntityRegistryError as exc: raise HTTPException(404, ...)` |
| **Test** | Sync/notes tests in `test_client_api_gaps.py` |

### Create record HTTP status

| | |
|--|--|
| **Error** | Test expects `200` but API returns `201` |
| **Where** | `test_client_api_gaps.py`, entity routes |
| **Fix** | Assert `response.status_code == 201` for POST records/notes |
| **Test** | `_create_product` helper in `test_client_api_gaps.py` |

### Platform core git guard

| | |
|--|--|
| **Error** | `test_platform_core_unchanged` fails with no git baseline |
| **Where** | `test_platform_core_unchanged.py` |
| **Fix** | Skip git diff guard when no committed HEAD baseline |
| **Test** | Self-documented skip in same file |

---

## Web client

### Grid spec fixtures — `GridMetadata` contract

| | |
|--|--|
| **Error** | Karma compile: `schema_version: 1` not assignable to `string`; column missing `sortable` / `filterable` |
| **Where** | `*.spec.ts` mocks for `getGridMetadata` or `GridMetadata` constants (e.g. `dynamic-data-grid.component.spec.ts`, `entity-list.component.spec.ts`) |
| **Fix** | Use `schema_version: '1'` (string); every column needs `sortable: boolean` and `filterable: boolean`; include `grouping`, `realtime`, `offline` on grid fixtures |
| **Test** | `npm run test:ci` — `dynamic-data-grid.component.spec.ts`, `entity-list.component.spec.ts` |

### SSE without auth headers

| | |
|--|--|
| **Error** | `EventSource` cannot send `Authorization` or `X-Tenant-ID` |
| **Where** | `clients/web/src/api/emcap-client.ts` — `subscribeRecordsStream` |
| **Fix** | Use `fetch` + `ReadableStream` with `this.headers()`, parse `data:` lines |
| **Test** | `test_client_api_gaps.py::test_realtime_stream_endpoint` (API); manual web grid refresh |

### PowerShell command chaining

| | |
|--|--|
| **Error** | `The token '&&' is not a valid statement separator` |
| **Where** | Ad-hoc terminal commands on Windows PowerShell 5.x |
| **Fix** | Use `;` or dedicated `.ps1` scripts under `scripts/` |
| **Test** | `scripts/verify-full-stack.ps1` |

---

## Mobile client

### GridMetadata missing offline/realtime

| | |
|--|--|
| **Error** | `grid.offline` undefined / compile error |
| **Where** | `clients/mobile/lib/metadata_contract.dart` |
| **Fix** | Parse `offline` and `realtime` from JSON; mirror `contract.ts` defaults |
| **Test** | Entity screen sync delta display; contract parity with API metadata |

### Flutter PATH — install stable SDK outside Downloads

| | |
|--|--|
| **Symptom** | `flutter` not recognized; `flutter test` fails before running; cannot capture M2 screenshots |
| **Where** | M2 mobile sign-off (P15-T13, P20-T03), P26 logo upload verify, Batch 3 partials, any local `flutter test` / PNG capture |
| **Cause** | `flutter` not on PATH; or SDK zip extracted under **Downloads** / `%TEMP%` (Windows Defender, Controlled folder access, or OneDrive can block or relocate binaries) |
| **Fix** | Unzip Flutter **stable** to a permanent path **outside Downloads** (e.g. `%USERPROFILE%\flutter\flutter_windows_3.44.2-stable\flutter`), add `...\flutter\bin` to user PATH, open a **new** terminal |
| **Verify** | `flutter --version`; `cd clients/mobile && flutter pub get && flutter test --coverage` |
| **M2 sign-off** | Follow `scripts/capture-m2-mobile-screenshots.md` after tests green. Skeleton: `clients/mobile/integration_test/m2_product_detail_test.dart`. **Do not mark Product-ready without PNG evidence.** |
| **CI** | Mobile lint/test runs in GitHub Actions when PR includes `clients/mobile/**` — local Flutter required for M2 PNG pack, not for landing mobile code. |

### Mobile `context.emcapTokens` without Theme extension

| | |
|--|--|
| **Error** | Falls back to `EmcapThemeTokens.light` in widget tests or screens without `EmcapTheme.buildThemeData` |
| **Where** | `clients/mobile/lib/theme/app_tokens.dart` — `EmcapThemeTokensContext` |
| **Fix** | Wrap test/widget in `MaterialApp(theme: EmcapTheme.buildThemeData(...))` or use `ThemeData(extensions: [EmcapThemeTokens.dark])` |
| **Test** | `theme_tokens_test.dart` — extension registered on built theme |

### Lookup field — entity vs record validation

| | |
|--|--|
| **Startup** | `registry.validate()` rejects unknown `lookup_entity` codes (module config typo) — see `test_registry_rejects_unknown_lookup_entity` |
| **Save time** | `EntityRepository` rejects missing or soft-deleted target **record IDs** when `registry` is passed — see `test_create_record_rejects_unknown_lookup_reference` |
| **Where** | `platform/api/src/emcap/persistence/repository.py`, `api/routes/entities.py` |

---

## Architecture

### Business feature in platform core

| | |
|--|--|
| **Error** | Inventory-specific logic in `platform/api/src/emcap/` |
| **Fix** | Only `modules/<name>/module.py`; enable via `EntityOptions` / report defs |
| **Test** | `test_platform_core_unchanged.py`, `verify-platform-core.ps1` |

### Stale agent skills

| | |
|--|--|
| **Symptom** | Skill says "Ansible TBD" or wrong test count |
| **Fix** | Update `.cursor/skills/` and this doc; point to `docs/dev/codebase-index.md` |

---

## Phase 7 — Client parity (prevent reintroduction)

### Client method without contract test

| | |
|--|--|
| **Symptom** | New API method ships without Jasmine contract test |
| **Fix** | Add to `REQUIRED_METHODS` in `emcap-client.test.ts` same PR |
| **Test** | `npm test` in `clients/web` |

### Web/mobile API parity drift

| | |
|--|--|
| **Symptom** | Method exists in web only |
| **Fix** | Add matching method in `emcap_client.dart`; update `04-capability-matrix.md` |
| **Test** | Manual parity checklist in `plan/06-sdd-gap-closure.md` |

### Feature UI without config gate

| | |
|--|--|
| **Symptom** | Payments/notifications UI shown when `modules.*.enabled: false` |
| **Fix** | Read `GET /api/v1/config/platform` or health before showing nav |
| **Test** | Assert nav hidden when flag off |

### Workflow action wrong HTTP verb

| | |
|--|--|
| **Symptom** | 405 on workflow transition |
| **Fix** | Match `workflows.py` route exactly (POST body shape) |
| **Test** | `test_inventory_e2e.py` workflow lifecycle |

### Field security — metadata leaks restricted fields

| | |
|--|--|
| **Symptom** | Viewer sees restricted field labels/inputs; only record values were stripped |
| **Where** | `api/routes/metadata.py` — must filter via `metadata/security.py` + `can_read_field()` |
| **Fix** | Filter form/grid metadata by `read_roles` + admin field overrides; strip restricted keys from grid `i18n` maps; web uses `securedVisibleFieldNames` |
| **Test** | `test_admin_field_access_override.py::test_metadata_form_hides_restricted_fields_for_viewer` (columns + `i18n.en`) |

### Ops tenant isolation — `schema_per_tenant` on SQLite

| | |
|---|---|
| **Symptom** | After `PUT /admin/ops/tenant-isolation` with `schema_per_tenant`, SQLite tests fail with `near "SCHEMA": syntax error` |
| **Cause** | `SchemaPerTenantStrategy.bind_session` runs PostgreSQL DDL |
| **Fix** | Use `database_per_tenant` or `shared_database` in local/CI tests; production Postgres for schema mode |
| **Test** | `test_admin_ops_isolation.py` (reverts to `shared_database` after assert) |

### SQLite databases committed to git

| | |
|--|--|
| **Symptom** | `emcap-local.db` / `emcap.db` show in `git status` |
| **Fix** | `*.db` in `.gitignore`; `git rm --cached` tracked DB files before push |
| **Test** | `git check-ignore -v emcap-local.db` |

### Document upload missing entity context

| | |
|--|--|
| **Symptom** | 422 on upload |
| **Fix** | Body must include `entity_code`, `record_id`, `filename`, `content` |
| **Test** | `test_client_api_gaps.py::test_document_list_by_record` (seed via upload) |

### Capability matrix not updated

| | |
|--|--|
| **Symptom** | Partial/No rows stale after merge |
| **Fix** | Update `spec/sdd/04-capability-matrix.md` in same PR as UI |
| **Test** | Review checklist P7-T16 |

---

## Phase 8 — End-user UX (prevent reintroduction)

### Edit form submits create instead of update

| | |
|--|--|
| **Symptom** | Duplicate records after Save on selected row |
| **Fix** | Branch on `selectedRecordId`: `updateRecord` vs `createRecord` |
| **Test** | Manual edit flow; extend renderer contract test |

### Search without debounce floods API

| | |
|--|--|
| **Symptom** | Rate limit or slow grid on every keystroke |
| **Fix** | Debounce search input 300ms; minimum 2 chars optional |
| **Test** | Manual search on Products |

### Condition evaluator trusts client-only

| | |
|--|--|
| **Symptom** | Hidden fields still sent in payload |
| **Fix** | Strip hidden field keys before submit; server validates anyway |
| **Test** | Form renderer unit test |

### i18n key shown instead of label

| | |
|--|--|
| **Symptom** | UI shows `product.name` not "Product Name" |
| **Fix** | Resolve `i18n[field.label_key] ?? field.label` |
| **Test** | `test_inventory_e2e.py` metadata keys |

### End-user matrix not updated

| | |
|--|--|
| **Symptom** | Phase 8 tasks marked Done but matrix still No |
| **Fix** | Update `spec/sdd/05-end-user-matrix.md` in same PR |
| **Test** | Review checklist P8-T23 |

### Mobile circular import (main ↔ shell)

| | |
|--|--|
| **Symptom** | Analyzer error importing `main.dart` from `shell.dart` for theme |
| **Fix** | Shared theme in `lib/theme.dart`; both import `theme.dart` |
| **Test** | `flutter analyze` |

### Flutter test package import

| | |
|--|--|
| **Symptom** | `package:emcap_mobile/...` not found in test |
| **Fix** | Use package name from `pubspec.yaml` (`emcap_mobile`) |
| **Test** | `flutter test` |

### Flutter widget test — `pumpAndSettle` on entity screens

| | |
|--|--|
| **Symptom** | Single test or full suite appears hung for minutes; agent/CI times out at 50–70+ min |
| **Where** | Any screen test with `CircularProgressIndicator` / loading semantics (`entity_list_screen_coverage_test.dart`, `settings_screen_coverage_test.dart`, etc.) |
| **Cause** | `pumpAndSettle()` waits up to **10 min per call** while progress indicators animate forever |
| **Fix** | Use `test/support/screen_test_harness.dart`: `settleEntityScreen`, `pumpUntilFound`, `pumpUntilAbsent` — never bare `pumpAndSettle` on entity/settings/workflow screens |
| **Test** | `flutter test test/entity_list_screen_coverage_test.dart` completes in ~30s |

### Flutter widget test — mock clients must stub `getPlatformConfig`

| | |
|--|--|
| **Symptom** | After list → record navigation, finder never sees `entity.newRecord` / Save; record screen stuck loading or error |
| **Where** | `EntityRecordScreen._loadForm()` → `widget.client.getPlatformConfig()` |
| **Cause** | Test `EmcapClient` subclasses override metadata/list but not `getPlatformConfig()` — base class hits HTTP (400 in widget tests) |
| **Fix** | Add `@override Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};` to every mock client that opens `EntityRecordScreen` |
| **Test** | `entity_list_screen_coverage_test.dart` — `EntityListScreen empty grid shows create action` |

### Flutter widget test — `settleEntityScreen` after Navigator.push

| | |
|--|--|
| **Symptom** | Harness returns early after route push; assertions fail on create headline |
| **Cause** | List route stays in tree under pushed record route — both expose `a11y.landmark.main`; harness matches list first |
| **Fix** | After navigation, `pumpUntilFound` on record-specific text (`entity.newRecord`, `entity.save`) or `find.byType(EntityRecordScreen)` — not `settleEntityScreen` alone |
| **Test** | Same create-action test in `entity_list_screen_coverage_test.dart` |

### Flutter widget test — MasterDetailLayout hides list pane on narrow width

| | |
|--|--|
| **Symptom** | After tapping a list item, finder cannot see list actions (e.g. settings **New template**) |
| **Where** | `settings_screen_coverage_test.dart`, any screen using `MasterDetailLayout` at test width &lt;900px |
| **Cause** | `detailOpen: true` replaces list pane with detail-only column on narrow layouts |
| **Fix** | Tap `common.back` before list-pane actions, or assert/create before opening detail |
| **Test** | `settings_screen_coverage_test.dart` — `SettingsScreen templates select create and save` |

### Flutter shell bootstrap — `listTenants` map vs list

| | |
|--|--|
| **Symptom** | Drawer shows platform links only (Workflow, Settings, …) — no entity menus (Products, Purchase Orders, …) on Flutter web/device |
| **Where** | `shell.dart` `_bootstrap` |
| **Cause** | API `GET /tenants` returns `tenants` as a **map** keyed by tenant id; casting to `List?` in `setState` throws → outer catch drops entity nav |
| **Fix** | Use `parseTenantEntries()` in `shell_nav_util.dart` (handles map and list shapes) |
| **Test** | `shell_nav_util_extended_test.dart` — `parseTenantEntries supports API map and test list shapes` |

## Phase 10 — Angular CLI web client

### npm ENOENT when running `npx ng new` (Windows)

| | |
|--|--|
| **Symptom** | `ENOENT: no such file or directory, lstat '%APPDATA%\npm'` |
| **Fix** | `New-Item -ItemType Directory -Force -Path "$env:APPDATA\npm"` then re-run `npx` |
| **Test** | `npx @angular/cli@19 version` |

### `ng new` fails mid-install (`readable-stream`)

| | |
|--|--|
| **Symptom** | Scaffold files created but `package.json` / `node_modules` incomplete |
| **Fix** | `cd clients/web && npm install` then `npm run build` |
| **Test** | `npm run build` succeeds |

### TS4111 on `Record<string, unknown>` (Angular strict)

| | |
|--|--|
| **Symptom** | Build errors: property must be accessed with `['field']` |
| **Fix** | `tsconfig.json` → `"noPropertyAccessFromIndexSignature": false` |
| **Test** | `npm run build` |

### Editing archived Vite shell

| | |
|--|--|
| **Symptom** | Changes in `clients/web-legacy/` do not appear in CI |
| **Fix** | Edit `clients/web/src/app/` only; legacy is read-only archive |
| **Test** | `cd clients/web && npm run build` |

### Karma hangs in CI or locally

| | |
|--|--|
| **Symptom** | `ng test` waits for browser or never exits |
| **Fix** | Use `npm run test:ci` (`--watch=false --browsers=ChromeHeadless`); CI needs `browser-actions/setup-chrome` |
| **Test** | `npm run test:ci` |

### CI still runs ESLint on web

| | |
|--|--|
| **Symptom** | `npm run lint` missing in Angular project |
| **Fix** | CI runs `format:check` + `lint` + `build` + `test:ci` (see `.github/workflows/ci.yml`) |
| **Test** | Push to PR; `client-lint-web` job green |

---

## Phase 11 — Local dev scripts, seed, lint gates

### Batch `%~dp0` empty when run from PowerShell

| | |
|--|--|
| **Symptom** | `'...\SDD\emcap-env.bat' is not recognized` (missing `scripts\`) |
| **Cause** | `scripts\run-emcap.bat` from PowerShell; `%~dp0` / `%EMCAP_SCRIPTS%` empty at parse time |
| **Fix** | `scripts/_resolve-scripts.bat` resolves `%CD%\scripts\`; run from **repo root** |
| **Test** | `cd SDD && scripts\run-emcap.bat --stack-only --no-follow` |

### Nested `call` clears `errorlevel`

| | |
|--|--|
| **Symptom** | `[stack] FAILED` but parent script reports success |
| **Cause** | `if errorlevel 1` after `call :log` or stale expansion |
| **Fix** | `set ERR=!errorlevel!` immediately after `call start-emcap-stack.bat` |
| **Test** | Manual: stop Docker → stack fails → run-emcap exits non-zero |

### Empty `:log ""` prints `ECHO is off`

| | |
|--|--|
| **Symptom** | `ECHO is off.` in console output |
| **Fix** | `:log` subroutine returns early when argument is empty |
| **Test** | Visual check running `run-emcap.bat` |

### GitHub Actions YAML: `sqlite:///:memory:`

| | |
|--|--|
| **Symptom** | `Invalid workflow file` on line with `DATABASE_URL: sqlite:///:memory:` |
| **Cause** | Trailing `:` in unquoted YAML value starts a new mapping key |
| **Fix** | Quote URL: `DATABASE_URL: "sqlite:///:memory:"` |
| **Test** | `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` |

### Pytest polluted by demo seed JSON

| | |
|--|--|
| **Symptom** | `test_customer_crud_and_audit` sees 2 records instead of 1 |
| **Cause** | `config/platform.yaml` has `seed.demo.enabled: true` on API startup in tests |
| **Fix** | `config/platform-test.yaml` (demo off); `conftest.py` points to it |
| **Test** | `platform/api/tests/test_seed_loader.py`, full pytest suite |

### `verify-full-stack` calls missing `npm run lint`

| | |
|--|--|
| **Symptom** | `npm run lint` fails on Angular project |
| **Fix** | Scripts call `scripts/lint-format.bat` first, then `build` + `test:ci` |
| **Test** | `.\scripts\verify-full-stack.ps1` |

### PowerShell date in `emcap-env.bat` breaks session folder

| | |
|--|--|
| **Symptom** | Log dir `logs\emcap\` with no timestamp |
| **Cause** | Nested quotes in `Get-Date -Format 'yyyyMMdd-HHmmss'` inside `for /f` |
| **Fix** | Use `Get-Date -Format yyyyMMdd-HHmmss` (no inner quotes); fallback `session` |
| **Test** | Run `run-emcap.bat`; log path includes timestamp folder |

### Docker not running

| | |
|--|--|
| **Symptom** | `[stack] FAILED` right after `docker compose up` |
| **Fix** | Start Docker Desktop; use `scripts\run-emcap.bat --stack-only --local` when Docker is not installed; `stop-emcap.bat` skips compose when `docker` is not on PATH |
| **Test** | Manual |

### Stale local API (admin routes 404)

| | |
|--|--|
| **Symptom** | `GET /api/v1/admin/users` → 404; OpenAPI has no `/admin/*` paths; web Admin pages fail |
| **Cause** | Uvicorn still running an old build from before admin routes were added |
| **Fix** | Restart API (`stop-emcap.bat` then `start-emcap-local.bat`, or kill port 8000 and rerun `run-api-with-logs.ps1`) |
| **Test** | `openapi.json` lists `/api/v1/admin/users`; admin users page loads |

### SQLite `emcap-local.db` schema drift

| | |
|--|--|
| **Symptom** | `sqlalchemy.exc.OperationalError: no such column: users.active` in `logs/emcap/api.log`; login fails after API restart |
| **Cause** | `create_all()` does not alter existing SQLite tables when models add columns |
| **Fix** | `init_db()` now applies SQLite column patches; or delete `emcap-local.db` and rerun `apply-seed.py` |
| **Test** | API starts; `POST /auth/login` returns 200 |

### `timeout`: Input redirection is not supported

| | |
|--|--|
| **Symptom** | `ERROR: Input redirection is not supported` when piping `run-emcap.bat` in PowerShell |
| **Cause** | Windows `timeout.exe` exits immediately if stdin is redirected |
| **Fix** | Scripts use `scripts/_sleep.bat` (`ping` loop) instead of `timeout` |
| **Test** | Run `scripts\run-emcap.bat --stack-only --local` directly (not piped) |

### `ruff` / `black` / `mypy` not recognized

| | |
|--|--|
| **Symptom** | `'ruff' is not recognized` when running `lint-format.bat` or `run-emcap.bat` |
| **Cause** | Dev tools installed in `platform/api` venv, not on global PATH |
| **Fix** | Scripts use `python -m ruff` etc.; `_ensure-python-dev.bat` runs `pip install -e ".[dev]"` if missing |
| **Test** | `scripts\lint-format.bat` from repo root |

### IDE Flake8 E501 on `scripts/*.py`

| | |
|--|--|
| **Symptom** | Flake8 line too long (79) in `scripts/apply-seed.py`; Ruff passes at 100 cols |
| **Cause** | IDE Flake8 defaults differ from `platform/api` Ruff config |
| **Fix** | Wrap lines in `scripts/` or exclude from Flake8; CI gate is `lint-format.bat` (Ruff) |
| **Test** | `python -m ruff check ../../scripts/apply-seed.py` |

### Uvicorn INFO shown as PowerShell errors (red)

| | |
|--|--|
| **Symptom** | `python : INFO: Started server process` with `NativeCommandError` in **EMCAP API** window |
| **Cause** | Uvicorn logs to stderr; PowerShell treats native stderr as errors when piping `python ... 2>&1 \| Tee-Object` |
| **Fix** | `scripts/run-api-with-logs.ps1` runs uvicorn via `cmd /c "... 2>&1"` before Tee-Object |
| **Note** | API is fine if you see `200 OK` on `/api/v1/health` |

### PowerShell `curl` is not curl

| | |
|--|--|
| **Symptom** | `Invoke-WebRequest` parameter errors when running `curl -sf ...` |
| **Cause** | PowerShell aliases `curl` to `Invoke-WebRequest` |
| **Fix** | Use `curl.exe` or browser; batch scripts use `curl.exe` where needed |
| **Test** | `curl.exe http://localhost:8000/api/v1/health` |

### Do not pipe batch files in PowerShell

| | |
|--|--|
| **Symptom** | Odd errors when running `cmd /c "scripts\run-emcap.bat ..." \| Select-Object` |
| **Cause** | Redirected stdin breaks `timeout` (legacy) and can confuse nested `start` |
| **Fix** | Run `scripts\run-emcap.bat` directly in terminal |
| **Guide** | `docs/dev/windows-local-dev.md` |

---

## Phase 12 — Enterprise product UI & admin (prevent repeat of “100% but bare UI”)

### Matrix 04/05 updated but 06 not

| | |
|--|--|
| **Symptom** | Stakeholders think admin/settings done; only API or Account demo exists |
| **Fix** | Update `spec/sdd/06-admin-product-ui-matrix.md` in same PR; use `plan/12-phase12-dod-checklist.md` |
| **Test** | PR checklist section 6 |

### Flat nav ignores `menu.module`

| | |
|--|--|
| **Symptom** | All entity links in one row; no Inventory/CRM grouping |
| **Where** | `clients/web/src/app/pages/shell/shell.component.ts` |
| **Fix** | Group `GET /menus` by `module`; API already returns field (`menus.py`) |
| **Test** | `shell.component.spec.ts` asserts multiple module groups |

### Account page used as admin console

| | |
|--|--|
| **Symptom** | Role assign by raw user ID; no user list/create |
| **Fix** | Dedicated `/app/admin/users`, `/app/admin/roles` routes |
| **Test** | Manual: create user in admin → login as that user |

### Admin API without UI (or reverse)

| | |
|--|--|
| **Symptom** | pytest green but no screen in sidenav |
| **Fix** | Same PR: route + page + nav link + matrix row |
| **Test** | DoD checklist sections 2–3 |

### Settings PUT returns secrets

| | |
|--|--|
| **Symptom** | Payment API keys visible in GET settings |
| **Fix** | Mask secrets; accept `***` placeholder on PUT to mean unchanged |
| **Test** | `test_admin_settings.py` asserts no raw secret in response |

### Module menus shown when module disabled

| | |
|--|--|
| **Symptom** | CRM menus visible after `modules.crm.enabled: false` |
| **Fix** | Filter menus client-side AND optionally server-side in `list_menus` |
| **Test** | Toggle in settings → nav updates without YAML edit |

### ABAC `evaluate_abac` prefers user attrs over resource context

| | |
|--|--|
| **Symptom** | `test_admin_abac_check_auth_deny_path` allow branch fails; literal policy values never match payload `tenant_id` |
| **Where** | `platform/api/src/emcap/auth/abac.py` — `_actual_attribute_value` |
| **Cause** | `actual = user_attrs.get(attr) or resource_attrs.get(attr)` always read user tenant first |
| **Fix** | Resolve `actual` from `resource_attrs` when policy value is literal or references `$user.` / `$resource.` |
| **Test** | `test_admin_abac_check_auth_deny_path` + `test_abac_check` |

### Tracked SQLite databases in git index

| | |
|--|--|
| **Symptom** | `git status` shows `emcap-local.db` or `platform/api/emcap*.db` after local stack runs |
| **Cause** | DB files were committed before `.gitignore` `*.db` / `emcap*.db` rule |
| **Fix** | `git rm --cached emcap-local.db platform/api/emcap-local.db platform/api/emcap.db` (keeps local files); verify with `git check-ignore emcap-local.db` |
| **Prevention** | `.gitignore` lines `*.db` and `emcap*.db`; never `git add` local SQLite |

### Stale `entity.component` or master–detail entity UX docs

| | |
|--|--|
| **Symptom** | Docs/skills reference `entity.component.*` or stacked list+form on one entity route |
| **Fix** | Web: separate `entity-list` + `entity-record` routes; mobile: push `entity_record_screen.dart`; master–detail only for **admin** panes |
| **Test** | Grep `entity.component` → 0 outside `docs/dev/session-memos/` |

### New admin client method without contract test

| | |
|--|--|
| **Symptom** | Web has `listAdminUsers`; mobile/contract missing |
| **Fix** | `emcap-client.spec.ts` + `emcap_client.dart` same PR |
| **Test** | Recipe `docs/dev/recipes/add-client-api-method.md` |

### Hard-coded English after i18n task

| | |
|--|--|
| **Symptom** | Toolbar still "Sign out" without translation key |
| **Fix** | All new chrome strings in `assets/i18n/*.json` |
| **Test** | Switch locale → toolbar text changes |

### Phase 12 work in `modules/` by mistake

| | |
|--|--|
| **Symptom** | User CRUD in `modules/inventory/` |
| **Fix** | Admin in `platform/api/src/emcap/admin/` only |
| **Test** | `verify-platform-core.ps1`; architecture review |

### Skipping Windows smoke after shell change

| | |
|--|--|
| **Symptom** | Works in IDE; batch stack fails |
| **Fix** | `scripts\run-emcap.bat --stack-only --local --skip-tests --skip-lint` from repo root |
| **Guide** | `docs/dev/windows-local-dev.md` |

### Docs not updated with code (mandatory gate)

| | |
|--|--|
| **Symptom** | Task Done; backlog Pending; index stale; recipes reference old paths |
| **Fix** | Same change: `docs/dev/recipes/sync-docs-after-change.md` · rule `.cursor/rules/emcap-doc-sync.mdc` |
| **Test** | PR checklist section 6 in `plan/12-phase12-dod-checklist.md` |

### Angular optional chain on Record index (NG8107)

| | |
|--|--|
| **Warning** | `NG8107: The left side of this optional chain operation does not include 'null' or 'undefined' in its type` |
| **Where** | `admin-security.component.html` — `abacFieldErrors[idx]?.permission` |
| **Cause** | Angular strict templates type `Record<number, T>` index access as always `T`, not `T \| undefined`; `?.` on the index is redundant |
| **Fix** | Use `abacFieldErrors[idx].permission` in template (falsy when key missing); keep `?.` in TS component code where index may be absent |
| **Test** | `cd clients/web && npm run build` — no NG8107 on admin-security template |

### Angular self-closing component with projected content (NG5002)

| | |
|--|--|
| **Error** | `NG5002: Unexpected closing tag "app-page-header"` or self-closing tag rejects child nodes |
| **Where** | `entity-record.component.html` — `<app-record-detail-header ... />` with toolbar/actions inside |
| **Cause** | Angular treats `/>` as void element; projected content between open/self-close is invalid |
| **Fix** | Use explicit open/close tags: `<app-record-detail-header>...</app-record-detail-header>`; ensure every custom element is properly closed |
| **Test** | `cd clients/web && npm run build` before marking Phase 12 UI Done |

### Admin API response field missing on TypeScript interface

| | |
|--|--|
| **Error** | TS2339: Property `override_paths` does not exist on type `AdminSettingsResponse` |
| **Where** | `settings.component.ts` reading `settingsPayload.override_paths` |
| **Cause** | Backend added `override_paths` to GET/PUT `/admin/settings` without updating `emcap-client.ts` |
| **Fix** | Add new fields to `AdminSettingsResponse` (and integrations response) in **same PR** as API or consumer |
| **Test** | `npm run build` + `settings.component.spec.ts` mock includes new fields |

### Branding preview contrast test uses failing color

| | |
|--|--|
| **Symptom** | `BrandingPreviewPanelComponent` spec fails: `contrastAdequate()` false for `#ff0000` |
| **Cause** | Pure red on white toolbar text is below WCAG AA 4.5:1 (~3.99:1) |
| **Fix** | Use `#005cbb` or another dark primary in preview specs; test low-contrast separately with `#ffffcc` |
| **Test** | `branding.util.spec.ts` + `branding-preview-panel.component.spec.ts` |

### Claiming Phase 12 Done without `npm run build`

| | |
|--|--|
| **Symptom** | Karma/pytest green but CI `client-lint-web` fails on template or strict TS errors |
| **Fix** | Run `cd clients/web && npm run build && npm run test:ci` locally before matrix/backlog Done |
| **Test** | `.github/workflows/ci.yml` `client-lint-web` job |

---

## Phase 16 — Standard product / entity platform (prevent reintroduction)

### Stale local API after platform entity changes

| | |
|--|--|
| **Symptom** | New routes 404 (`/restore`, soft delete); OpenAPI missing `If-Match`; web save always fails or ignores version |
| **Cause** | Uvicorn still running an old build before `record_version` / `deleted_at` repository changes |
| **Fix** | `scripts\stop-emcap.bat` then `scripts\run-emcap.bat --stack-only --local` (or kill port 8000 and rerun `run-api-with-logs.ps1`) |
| **Test** | `curl.exe http://localhost:8000/openapi.json` lists entity restore route; `test_system_fields.py` green |

### Version conflict 409 on Save

| | |
|--|--|
| **Symptom** | Save shows error after editing a record left open; API returns **409** with version conflict detail |
| **Cause** | Stale `record_version` in form — another session/tab incremented version, or grid reload did not refresh detail |
| **Where** | `platform/api/src/emcap/persistence/repository.py` (PUT); web `entity-record.component.ts` sends `If-Match` from `formValues['record_version']` |
| **Fix** | Re-select row or reload list to fetch current `record_version`; submit again with fresh version; do not strip `record_version` from loaded record |
| **Test** | `test_system_fields.py::test_version_conflict_returns_409` |

### Soft delete hides record from grid

| | |
|--|--|
| **Symptom** | Row disappears after delete; search cannot find SKU; user thinks data was lost |
| **Cause** | `deleted_at` set; list query filters `deleted_at IS NULL` by default (`repository.py`) |
| **Fix** | Expected behavior — use `POST .../records/{id}/restore` or restore UI when wired (P14-T14); audit tab still shows history |
| **Test** | `test_system_fields.py` soft delete + restore; `test_inventory_e2e.py` delete assertions on `deleted_at`; DELETE returns **200** + body with `deleted_at`, not **204** |

### Entity DELETE returns 200 (soft delete body), not 204

| | |
|--|--|
| **Symptom** | Contract tests assert `delete.status_code == 204` after system-column / soft-delete work |
| **Cause** | `entities.delete_record` returns the soft-deleted record dict (200) for audit/UI parity |
| **Fix** | Assert `200` and `deleted_at is not None`; use restore endpoint to undo |
| **Test** | `test_health.py::test_customer_crud_and_audit`; `test_crm_e2e.py::test_lead_crud` |

### Product grid still shows 2 rows after seed expansion

| | |
|--|--|
| **Symptom** | Demo shows only `SKU-DEMO-001` / `002` despite `products.json` has 20 rows |
| **Cause** | SQLite `emcap-local.db` or Postgres DB seeded before JSON update; seed IDs are upserted but old session never re-applied |
| **Fix** | `python scripts\apply-seed.py` (Postgres) or delete `emcap-local.db` and restart API; verify `data/seed/demo/products.json` |
| **Test** | Manual: Inventory → Products shows 20 rows; runbook `docs/dev/product-demo-runbook.md` |

### Entity routes eager-loaded inflate initial bundle

| | |
|--|--|
| **Symptom** | `ng build` warns initial chunk >900 kB despite admin lazy routes |
| **Cause** | `EntityListComponent` / `EntityRecordComponent` imported eagerly in `app.routes.ts` — pulls grid, form, tabs, document preview into main chunk |
| **Fix** | Use `loadComponent` for `entity/:code`, `entity/:code/:recordId`, `entity/:code/new`, plus `notifications` and `account`; verify with `app.routes.spec.ts` |
| **Test** | `npm run build` — initial total ≤900 kB; Karma `app.routes.spec.ts` |

### STOCK_MOVEMENT create requires movement_number + reference_type

| | |
|--|--|
| **Symptom** | Product smoke test gets 400 on `POST .../STOCK_MOVEMENT/records` |
| **Cause** | Movement entity requires `movement_number`, `reference_type`, `active` in addition to type/date/warehouse |
| **Fix** | Mirror payload from `test_stock_movement_entities.py::_create_draft_movement_with_line` |
| **Test** | `test_inventory_product_smoke.py`

### axe-core `label` rule on Material mat-checkbox (Karma)

| | |
|--|--|
| **Symptom** | `settings.a11y.spec.ts` fails: `label` — hidden explicit `<label>` on `mat-mdc-checkbox` |
| **Cause** | Angular Material associates checkbox via `aria-labelledby`; axe `label` rule false-positives in component isolation |
| **Fix** | Disable `label` in `a11y.util.ts` `COMPONENT_SCOPE_DISABLED_RULES`; full-page Playwright axe can re-enable when stack is up |
| **Test** | `entity-list.a11y.spec.ts`, `settings.a11y.spec.ts`; `npm run test:a11y` |

---

| | |
|--|--|
| **Symptom** | Inconsistent spacing/colors between entity and admin after Phase 16 polish |
| **Cause** | Raw hex/pixel values in `shared/` instead of `--emcap-*` tokens (ADR-006) |
| **Fix** | Use `styles/_tokens.scss` and catalog `docs/product/design-system.md`; reject ad hoc values in review |
| **Test** | Visual screenshot pair at 1280px; dark mode audit table in `design-system.md` (P16-T08 Done) |

### Dark mode badge hex in component SCSS

| | |
|--|--|
| **Symptom** | SLA/virus badges fail contrast on `html[data-theme=dark]` |
| **Cause** | Hardcoded `#e6f4ea` / `#137333` light-only pairs in `record-tabs`, `workflow` SCSS |
| **Fix** | Use `--emcap-badge-*` tokens from `_tokens.scss` (dark overrides included) |
| **Test** | Toggle dark theme on workflow inbox + record Documents tab |

### Playwright Chromium not installed (screenshot scripts)

| | |
|--|--|
| **Symptom** | `capture-screenshot-sprint.mjs` fails: `Executable doesn't exist` / banner suggests `npx playwright install` |
| **Cause** | Fresh clone or CI agent without Playwright browser binaries |
| **Where** | `scripts/capture-screenshot-sprint.mjs`, `scripts/capture-m1-screenshots.mjs` |
| **Fix** | `npx --yes playwright@1.49.1 install chromium` then re-run script; stack must be up (`scripts\start-emcap-local.bat`) |
| **Test** | `node scripts/capture-screenshot-sprint.mjs --only=admin-settings` |

### Playwright entity screenshots after list/record route split

| | |
|--|--|
| **Symptom** | `capture-screenshot-sprint.mjs` or M1 script times out on Workflow tab or detail header — still on `/app/entity/PRODUCT` list URL |
| **Cause** | Slice 15C split routes: grid is list-only; record actions/tabs live on `/app/entity/:code/:id` or `/new` |
| **Where** | `scripts/capture-screenshot-sprint.mjs`, `scripts/capture-m1-screenshots.mjs` |
| **Fix** | Click grid row → wait for record URL; use `.record-tabs__group [role="tab"]` last tab for Workflow; list PNGs from list route only |
| **Test** | `node scripts/capture-m1-screenshots.mjs`; `node scripts/capture-screenshot-sprint.mjs --only=product-workflow` |

---

## NFR-003 — Web Karma branch coverage (prevent spec regressions)

Recipe: `docs/dev/recipes/add-coverage-gate.md`. Gate: `karma.conf.js` **80% branches** (Sprint 14, 2026-06-16 — **954/1184**, **406** specs).

### Settings payment — `onPaymentChange` before credentials

| | |
|--|--|
| **Symptom** | Payment apply/save tests fail or `payments.stripe` is boolean `true` instead of credential object |
| **Cause** | `onPaymentChange({ key: 'stripe', checked: true })` runs before `applyPaymentCredentials()` and overwrites nested provider object |
| **Fix** | Call `selectPaymentProvider('stripe')` (or target provider) instead of toggling via `onPaymentChange` first |
| **Test** | `settings.component.spec.ts` payment credential tests |

### Entity-record — async `restoreRecord` race

| | |
|--|--|
| **Symptom** | Validation tests mutate `formValues` before form is hydrated; flaky pass/fail |
| **Cause** | `restoreRecord()` is async; spec continues before record load completes |
| **Fix** | `await fixture.whenStable()` (and resolve mocks) before mutating `formValues` or asserting validators |
| **Test** | `entity-record.component.spec.ts` restore + validation specs |

### Entity-record — router NG04002 after create/delete

| | |
|--|--|
| **Error** | `NG04002: Cannot match any routes` when navigating after create or delete |
| **Cause** | `RouterTestingModule` only defines list route `app/entity/:code`, not record route |
| **Fix** | Provide **both** `app/entity/:code` and `app/entity/:code/:recordId` (and `/new` if tested) |
| **Test** | `entity-record.component.spec.ts` create/delete navigation specs |

### Reports `scheduleLabel` — i18n string mismatch

| | |
|--|--|
| **Symptom** | Expect `'No schedule'` but received `'Manual only'` |
| **Cause** | Key `platform.reports.noSchedule` resolves to **Manual only** in `en` bundle |
| **Fix** | Assert translated label (`Manual only`) or spy `I18nService.t` with the key |
| **Test** | `reports.component.spec.ts` |

### `exportUtil.downloadCsv` — ES module not spyable

| | |
|--|--|
| **Symptom** | `spyOn(exportUtil, 'downloadCsv')` throws or never called |
| **Cause** | ES module exports are not reliably spyable in Karma/Jasmine |
| **Fix** | Assert component side effects (`historyError`, `isDownloading`) instead of spying the util |
| **Test** | `entity-list.component.spec.ts` export error path |

### Workflow `slaLabel` — missing `due_at`

| | |
|--|--|
| **Symptom** | `slaLabel` assertion is empty string |
| **Cause** | Instance without `due_at` → SLA level `'none'` → label returns empty |
| **Fix** | Use workflow instance fixture with `due_at` set when testing SLA label text |
| **Test** | `workflow.component.spec.ts` |

### DynamicFormRenderer `equals` with boolean

| | |
|--|--|
| **Symptom** | Condition visibility test fails when `value: true` in rule |
| **Cause** | `equals` compares types strictly; `{ flag: 'yes' }` does not match boolean `true` |
| **Fix** | Pass `{ flag: true }` in test `formValues` when rule uses `value: true` |
| **Test** | `dynamic-form.renderer.spec.ts` condition specs |

### Entity-list pagination — page count

| | |
|--|--|
| **Symptom** | Expected 2 pages, component reports 3 |
| **Cause** | `DEFAULT_PAGE_SIZE` is **10**; 25 records → **3** pages (not 2) |
| **Fix** | Use `Math.ceil(25 / 10)` or assert `totalPages === 3` |
| **Test** | `entity-list.component.spec.ts` pagination |

### Admin-roles — reject then `selectRole` without reload

| | |
|--|--|
| **Symptom** | `selectRole` runs against stale/empty list after `listAdminRoles` reject |
| **Cause** | Component still in prior load state; mobile layout needs explicit reload |
| **Fix** | After reject mock, call `reload()` before `selectRole`; use `BehaviorSubject` for `isMobile$` |
| **Test** | `admin-roles.component.spec.ts` error + mobile layout |

### Contract label fallbacks — empty string is not nullish

| | |
|--|--|
| **Symptom** | `resolveFieldLabel` / `resolveColumnLabel` return `''` instead of falling back to `name` |
| **Cause** | Fallback uses `??`; empty string `''` is **not** nullish |
| **Fix** | Use `undefined` (omit `label` / `label_key`) in fixtures when testing name fallback |
| **Test** | `metadata/contract.spec.ts` |

### `canPostMovement` — incomplete component state

| | |
|--|--|
| **Symptom** | `canPostMovement()` false when all mocks look correct |
| **Cause** | Requires `entityCode='STOCK_MOVEMENT'`, `formValues.status='draft'`, `selectedRecordId`, `creatingNew=false` |
| **Fix** | Set all four on component before asserting post eligibility |
| **Test** | `entity-record.component.spec.ts` post movement |

### Settings integration status label — wrong enum

| | |
|--|--|
| **Symptom** | `integrationStatusLabel` does not match expected copy |
| **Cause** | Status value `'missing'` is wrong; API/settings use `'not_configured'` |
| **Fix** | Use `'not_configured'` in integration status fixtures |
| **Test** | `settings.component.spec.ts` integrations tab |

### Settings report schedule spec — client cron blocks API path

| | |
|--|--|
| **Symptom** | `saveReportSchedule` test expects API error `'cron invalid'` but gets i18n `settings.reports.invalidCron` |
| **Cause** | `saveReportSchedule` validates cron client-side first (`isValidCronExpression` = exactly 5 whitespace-separated fields); invalid cron never reaches API |
| **Fix** | Use a **valid** 5-field cron (e.g. `0 7 * * *`) in the schedule row when testing API rejection; reserve invalid cron (`bad-cron`) for client-side validation spec |
| **Test** | `settings.component.spec.ts` — `handles reload errors and report schedule save failure` |

### `resolvePageTitle` — default title needs translate mock

| | |
|--|--|
| **Symptom** | Spec expects `'EMCAP'` but gets `'shell.pageTitle.default'` |
| **Cause** | `resolvePageTitle` returns `t('shell.pageTitle.default')`; without `translate` arg, fallback is identity `(key) => key` |
| **Fix** | Pass `translate: (key) => key === 'shell.pageTitle.default' ? 'EMCAP' : key` in tests for default/fallback paths |
| **Test** | `page-title.util.spec.ts` — `falls back to entity code or translated default title` |

### Admin load errors — use EmptyState + retry (Product-ready DoD)

| | |
|--|--|
| **Symptom** | Admin pages show plain `<p class="error">` with no retry; toolbar still visible on failed load |
| **Cause** | Pre–P18-T21 pattern; inconsistent with workflow/reports/settings |
| **Fix** | `@if (loadError)` → `app-empty-state` + `common.retry`; hide list pane until reload succeeds; users: separate `saveError` from `loadError` |
| **Test** | `admin-users.component.spec.ts`, `admin-roles.component.spec.ts`, `admin-security.component.spec.ts` |

### Web vs mobile i18n bundle drift

| | |
|--|--|
| **Symptom** | Mobile shows raw keys or English fallbacks for new web strings |
| **Cause** | Web `en.json` ~596 lines vs mobile ~367 (~229 keys behind after M6 shell/settings/auth work) |
| **Fix** | When adding web i18n keys for P18-T12, sync matching keys to `clients/mobile/assets/i18n/{en-US,bn-BD,fr-FR}.json` in same change; run `node scripts/audit-i18n.mjs` |
| **Test** | `i18n_keys_parity_test.dart`; `node scripts/audit-i18n.mjs` (CI `client-lint-web` job) |

### P27 BCP 47 locale tag migration

| | |
|--|--|
| **Symptom** | Locale picker shows English after upgrade; `document.documentElement.lang` is `en` not `en-US`; mobile loads wrong bundle |
| **Cause** | `localStorage emcap-locale` still stores legacy short tags (`en`, `bn`, `fr`); code imports `en-US.json` but reads stored `en` without alias |
| **Fix** | `I18nService.init()` / `EmcapLocale.init()` normalize via alias map (`en`→`en-US`, etc.) and **write back** canonical tag; keep legacy JSON files one release; use `numberingSystem: 'beng'` / `bn_BD` locale for Bengali digits in format utils |
| **Test** | `i18n.service.spec.ts` legacy migration; `i18n_bundle_test.dart` alias resolution; `node scripts/audit-i18n.mjs` (bn-BD parity + web→mobile keys); `i18n_keys_parity_test.dart` |

### Playwright screenshot capture on Windows

| | |
|--|--|
| **Symptom** | `capture-screenshot-sprint.mjs` fails — Chromium not found; or sandbox error on `npx playwright install` |
| **Cause** | Playwright browsers not installed; some Cursor sandboxes block install/start scripts |
| **Fix** | Run `npx --yes playwright@1.49.1 install chromium` outside sandbox; stack up via `scripts/start-emcap-local.bat` (API `:8000`, web `:4200`); then `node scripts/capture-screenshot-sprint.mjs --only=admin-settings` |
| **Test** | 8+ PNGs in `docs/product/screenshots/phase19-*.png`; `--only=shell-nav`, `--only=report-schedules` |

### Rule evaluate spec async config load

| | |
|--|--|
| **Symptom** | `RuleEvaluateComponent retries config load on failure` expects `Retry` but DOM shows `Loading…` |
| **Cause** | `ngOnInit` → `loadConfig()` async; first `whenStable()` may resolve before promise settles |
| **Fix** | Await `fixture.componentInstance.loadConfig()` then re-`detectChanges()`; assert `app-empty-state` not button text |
| **Test** | `rule-evaluate.component.spec.ts` |

### Entity delete confirm i18n

| | |
|--|--|
| **Symptom** | Hardcoded `` `Delete record ${id}?` `` in `entity-record.component.ts` |
| **Fix** | Use `entity.deleteConfirm` with `{id}` placeholder + `.replace('{id}', id)` |
| **Test** | Karma entity-record specs; FR/BN keys in `assets/i18n/` |

### P25 backend domain validators (modules only)

| | |
|--|--|
| **Symptom** | PO receive does not spawn STOCK_MOVEMENT; payment post does not update balances; JE post skips account rollup |
| **Cause** | Validator in `platform/` instead of `modules/`; missing `ENTITY_VALIDATORS` export; update validator called without `context` (`repo`, `registry`, `record_id`) |
| **Fix** | Put rules in `modules/{procurement,sales,accounting}/*.py`; export via `module.py` `ENTITY_VALIDATORS`; side effects only on partial update transitions (draft→received/posted); finance amounts use `read_roles=["accounting.view"]` |
| **Test** | `test_purchase_order_entities.py`, `test_vendor_payment_entities.py`, `test_customer_payment_entities.py`, `test_journal_double_entry.py`, `test_finance_field_security.py` |

| | |
|--|--|
| **Symptom** | `powershell -Command "… $_.Exception.Message …"` → parser error on `$_.` |
| **Cause** | Outer shell strips `$` from `$_` when nested |
| **Fix** | Use single-level PowerShell or escape `$`; prefer simple `Invoke-WebRequest` without nested catch string concat |
| **Test** | Manual stack health check |
