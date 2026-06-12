# EMCAP — Codebase Index

Quick lookup for agents and developers. **Read this before broad codebase search.**

**After any code change:** run `docs/dev/recipes/sync-docs-after-change.md` (rule: `.cursor/rules/emcap-doc-sync.mdc`).

## Read first

| Need | Document |
|------|----------|
| Task status | `plan/03-task-backlog.md` |
| **Doc sync checklist** | `docs/dev/recipes/sync-docs-after-change.md` |
| **Phase 12 enterprise UI** | `plan/12-enterprise-product-ui.md`, `plan/12-phase12-dod-checklist.md` |
| **Shared web components** | `clients/web/src/app/shared/README.md` |
| **Product/admin UX gap** | `spec/sdd/06-admin-product-ui-matrix.md` |
| Local stack (Windows) | `plan/11-local-dev-tooling.md`, `docs/dev/recipes/run-emcap-local-stack.md` |
| Angular web client | `plan/10-angular-cli-web.md`, ADR-005 |
| Phase 8 end-user UX | `plan/07-phase8-end-user-product.md` |
| Platform service status | `spec/sdd/04-capability-matrix.md` |
| End-user UX status | `spec/sdd/05-end-user-matrix.md` |
| Client API mapping | `plan/04-client-api-completion.md` |
| Windows local dev guide | `docs/dev/windows-local-dev.md` |
| Pitfalls / regressions | `docs/dev/known-pitfalls.md` |
| How-to recipes | `docs/dev/recipes/` |

---

## Monorepo zones

| Zone | Key paths | When to touch |
|------|-----------|---------------|
| Platform API | `platform/api/src/emcap/` | Generic HTTP + services |
| **Admin API** | `platform/api/src/emcap/admin/`, `api/routes/admin.py` | Users, roles, settings, templates |
| Seed loader | `platform/api/src/emcap/seed/` | JSON seed apply/purge |
| Business modules | `modules/*/module.py` | Features **only** under `modules/` |
| **Web (Angular CLI)** | `clients/web/src/app/` | Presentation — canonical |
| Web API client | `clients/web/src/app/api/emcap-client.ts` | HTTP methods |
| Web metadata | `clients/web/src/app/metadata/` | Contract + renderers |
| **Web shared UI** | `clients/web/src/app/shared/` | Reusable layout, nav, grid, forms — **`shared/README.md`** |
| Web pages | `clients/web/src/app/pages/` | Thin pages; compose shared components |
| Web shell | `clients/web/src/app/pages/shell/` | Wrapper over `AppLayoutComponent` |
| Web entity | `clients/web/src/app/pages/entity/` | Master–detail via shared components |
| Web admin (Phase 12) | `clients/web/src/app/pages/admin/` | Users, roles — reuse master–detail |
| Web settings (Phase 12) | `clients/web/src/app/pages/settings/` | Module toggles, templates |
| Menus API | `platform/api/src/emcap/api/routes/menus.py` | Returns `module` per item |
| Web legacy (archive) | `clients/web-legacy/` | Read-only reference |
| Mobile | `clients/mobile/lib/` | Flutter shell |
| Config | `config/platform.yaml`, `config/platform-test.yaml` | Feature flags, seed |
| Seed JSON | `data/seed/core/`, `data/seed/demo/` | Core + demo data packs |
| Local scripts | `scripts/run-emcap.bat`, `scripts/lint-format.bat` | Dev workflow |
| Run logs | `logs/emcap/<session>/` | gitignored session logs |
| CI | `.github/workflows/ci.yml` | lint, pytest, `ng build`, `ng test:ci` |
| Agent rules | `.cursor/rules/emcap-doc-sync.mdc` | **Docs mandatory with code** |

---

## Web shared component map

| Folder | Contents |
|--------|----------|
| `shared/layout/` | `AppLayoutComponent`, `MasterDetailLayoutComponent`, `PageHeaderComponent` |
| `shared/navigation/` | `SidenavNavComponent`, `TenantSelectComponent` |
| `shared/data/` | `DynamicDataGridComponent` |
| `shared/forms/` | `DynamicFormViewComponent` |
| `shared/entity/` | `RecordTabsComponent` |
| `shared/services/` | `LayoutService`, `ShellContextService`, `ThemeService`, `I18nService` |
| `shared/utils/` | export, page-title, record, tenant helpers |
| `services/shell-nav.util.ts` | Menu filter + module grouping (app root) |

---

## Scripts (Windows)

| Script | Purpose |
|--------|---------|
| `scripts/run-emcap.bat` | Lint → tests → Docker stack → seed → web → tail logs |
| `scripts/run-emcap.bat --stack-only` | Skip lint/tests |
| `scripts/run-emcap.bat --stack-only --local` | No Docker; SQLite + uvicorn |
| `scripts/stop-emcap.bat` | `docker compose down` + free ports 8000/4200 |
| `scripts/logs-emcap.bat` | Re-follow Docker logs |
| `scripts/lint-format.bat` | ruff/black/mypy + prettier/eslint + dart format |
| `scripts/_resolve-scripts.bat` | Resolve `scripts\` from repo root (PowerShell-safe) |
| `scripts/apply-seed.py` | Apply JSON seed to running Postgres |

**Run from repository root:** `scripts\run-emcap.bat`

---

## Test files

| File | Guards |
|------|--------|
| `platform/api/tests/*.py` | Backend + modules |
| `platform/api/tests/test_seed_loader.py` | JSON seed + demo purge |
| `clients/web/src/app/api/emcap-client.spec.ts` | API method contract (Jasmine) |
| `clients/web/src/app/services/shell-nav.util.spec.ts` | Module nav filter/group + admin links |
| `clients/web/src/app/shared/services/theme.service.spec.ts` | Theme persistence |
| `clients/web/src/app/shared/services/i18n.service.spec.ts` | Locale bundles |
| `clients/web/src/app/shared/utils/export.util.spec.ts` | CSV export |
| `platform/api/tests/test_admin_api.py` | Admin users/roles/settings/templates |
| `clients/web/src/app/shared/utils/page-title.util.spec.ts` | Toolbar title resolution |
| `clients/web/src/app/metadata/dynamic-form.renderer.spec.ts` | Form renderer |
| `clients/mobile/test/metadata_contract_test.dart` | Flutter metadata renderer parity |
| `clients/mobile/test/shell_nav_util_test.dart` | Module nav filter/group + admin links |
| `clients/mobile/test/preferences_service_test.dart` | Theme/locale persistence keys |

---

## Verify commands

```powershell
cd C:\path\to\SDD
scripts\lint-format.bat
scripts\run-emcap.bat --stack-only --local
```

Or layer by layer:

```powershell
cd platform/api; ruff check src tests; black --check src tests; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run format:check; npm run lint; npm run build; npm run test:ci
cd clients/mobile; dart format --output=none --set-exit-if-changed .; flutter analyze; flutter test
.\scripts\verify-full-stack.ps1
```

**Gates:** lint-format · pytest 80% (total ~87%) · Angular format+lint+build+Karma (20 tests) · flutter test
