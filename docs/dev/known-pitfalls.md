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
| **Fix** | Start Docker Desktop; inspect `logs/emcap/<session>/docker-start.log` |
| **Test** | Manual |

### `ruff` / `black` / `mypy` not recognized

| | |
|--|--|
| **Symptom** | `'ruff' is not recognized` when running `lint-format.bat` or `run-emcap.bat` |
| **Cause** | Dev tools installed in `platform/api` venv, not on global PATH |
| **Fix** | Scripts use `python -m ruff` etc.; `_ensure-python-dev.bat` runs `pip install -e ".[dev]"` if missing |
| **Test** | `scripts\lint-format.bat` from repo root |
