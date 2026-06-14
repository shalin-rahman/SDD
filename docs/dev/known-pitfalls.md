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

### M2 blocked — Flutter not installed locally

| | |
|--|--|
| **Symptom** | `flutter` not recognized; cannot run `clients/mobile`, capture M2 screenshots, or P16-T03 tokens |
| **Where** | S2 (P15-T13, P20-T03), S3 (P16-T03), P17-T02 mobile inbox |
| **Workaround** | **Skip S2/S3** on this machine; continue **web-only** viable product (P17 reports/docs, P14 lookup, P19 admin). M1 web gate already signed. |
| **To unblock M2** | Install Flutter SDK, add `flutter\bin` to PATH, then follow `scripts/capture-m2-mobile-screenshots.md` (`flutter pub get`, `flutter test`, run app, capture `phase15-mobile-product-detail.png`). Skeleton: `clients/mobile/integration_test/m2_product_detail_test.dart`. |
| **CI** | Mobile lint/test still runs in GitHub Actions when PR includes `clients/mobile/**` — local Flutter optional until M2 sign-off. |

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

### Master–detail still stacked on desktop

| | |
|--|--|
| **Symptom** | List above form; not single-page ERP layout |
| **Fix** | `mat-sidenav-container` or CSS grid split ≥1024px |
| **Test** | `entity.component.spec.ts`; visual at 1280px |

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

---

## Phase 16 — Viable product / entity platform (prevent reintroduction)

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
| **Where** | `platform/api/src/emcap/persistence/repository.py` (PUT); web `entity.component.ts` sends `If-Match` from `formValues['record_version']` |
| **Fix** | Re-select row or reload list to fetch current `record_version`; submit again with fresh version; do not strip `record_version` from loaded record |
| **Test** | `test_system_fields.py::test_version_conflict_returns_409` |

### Soft delete hides record from grid

| | |
|--|--|
| **Symptom** | Row disappears after delete; search cannot find SKU; user thinks data was lost |
| **Cause** | `deleted_at` set; list query filters `deleted_at IS NULL` by default (`repository.py`) |
| **Fix** | Expected behavior — use `POST .../records/{id}/restore` or restore UI when wired (P14-T14); audit tab still shows history |
| **Test** | `test_system_fields.py` soft delete + restore; `test_inventory_e2e.py` delete assertions on `deleted_at` |

### Product grid still shows 2 rows after seed expansion

| | |
|--|--|
| **Symptom** | Demo shows only `SKU-DEMO-001` / `002` despite `products.json` has 20 rows |
| **Cause** | SQLite `emcap-local.db` or Postgres DB seeded before JSON update; seed IDs are upserted but old session never re-applied |
| **Fix** | `python scripts\apply-seed.py` (Postgres) or delete `emcap-local.db` and restart API; verify `data/seed/demo/products.json` |
| **Test** | Manual: Inventory → Products shows 20 rows; runbook `docs/dev/product-demo-runbook.md` |

### Design tokens bypassed in new shared SCSS

| | |
|--|--|
| **Symptom** | Inconsistent spacing/colors between entity and admin after Phase 16 polish |
| **Cause** | Raw hex/pixel values in `shared/` instead of `--emcap-*` tokens (ADR-006) |
| **Fix** | Use `styles/_tokens.scss` and catalog `docs/product/design-system.md`; reject ad hoc values in review |
| **Test** | Visual screenshot pair at 1280px; dark mode contrast audit P16-T08 |

### Playwright entity screenshots after list/record route split

| | |
|--|--|
| **Symptom** | `capture-screenshot-sprint.mjs` or M1 script times out on Workflow tab or detail header — still on `/app/entity/PRODUCT` list URL |
| **Cause** | Slice 15C split routes: grid is list-only; record actions/tabs live on `/app/entity/:code/:id` or `/new` |
| **Where** | `scripts/capture-screenshot-sprint.mjs`, `scripts/capture-m1-screenshots.mjs` |
| **Fix** | Click grid row → wait for record URL; use `.record-tabs__group [role="tab"]` last tab for Workflow; list PNGs from list route only |
| **Test** | `node scripts/capture-m1-screenshots.mjs`; `node scripts/capture-screenshot-sprint.mjs --only=product-workflow` |
