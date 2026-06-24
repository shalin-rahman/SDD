# Recipe — Verify web + mobile client tests (NFR-003)

Run **all** automated client tests in one command: Angular Karma (web) + Flutter widget/unit tests (mobile), with coverage gates.

## When to use

- After touching `clients/web/**` or `clients/mobile/**`
- Before marking Product-ready or closing a client UX task
- Local substitute for CI `client-lint-web` + `client-lint-mobile` jobs

## Commands

**All clients (recommended):**

```powershell
cd C:\path\to\SDD
.\scripts\verify-clients.ps1
```

**Faster (no coverage gates):**

```powershell
.\scripts\verify-clients.ps1 -SkipCoverage
```

**Single surface:**

```powershell
.\scripts\verify-clients.ps1 -WebOnly
.\scripts\verify-clients.ps1 -MobileOnly
```

Linux/macOS:

```bash
./scripts/verify-clients.sh
./scripts/verify-clients.sh --skip-coverage
```

**Full stack (API pytest + lint + web build + client verify + optional health):**

```powershell
.\scripts\verify-full-stack.ps1
```

## What runs

| Step | Command | Gate |
|------|---------|------|
| Web unit/component | `npm run test:ci` | ChromeHeadless, all `*.spec.ts` |
| Web coverage | `npm run test:coverage` | **≥80% branches** (`karma.conf.js`) |
| Mobile | `flutter test --coverage` | All `test/*_test.dart` |
| Mobile coverage | `check-flutter-coverage.py --min 80` | **≥80% lines** |

Skip coverage with `-SkipCoverage` / `--skip-coverage` (runs `test:ci` + `flutter test` only).

## Feature coverage map

| Feature | Web spec(s) | Mobile test(s) |
|---------|-------------|----------------|
| Entity list/record | `entity-list.component.spec.ts`, `entity-record.component.spec.ts` | `entity_list_screen_*`, `entity_record_screen_*` |
| Workflow inbox | `workflow.component.spec.ts` | `workflow_inbox_screen_test.dart` |
| Admin users/roles/security | `admin-*.component.spec.ts` | `admin_screens_test.dart`, `admin_security_field_access_test.dart` |
| Settings | `settings.component.spec.ts`, `rule-evaluate.component.spec.ts` | `settings_screen_*` |
| Dynamic form/grid | `dynamic-form.renderer.spec.ts`, `dynamic-form-view.component.spec.ts`, `dynamic-data-grid.component.spec.ts` | `metadata_contract_test.dart`, `field_types_fixture_test.dart` |
| Document preview | `document-preview-panel.component.spec.ts`, `document-preview.util.spec.ts` | `document_preview_dialog_test.dart`, `document_preview_util_test.dart` |
| Notifications | `notifications.component.spec.ts` | `platform_screens_test.dart` |
| Reports | `reports.component.spec.ts` | `platform_screens_test.dart` |
| Dashboards | `dashboards.component.spec.ts` | `platform_screens_test.dart` |
| Account | `account.component.spec.ts` | `account_screen_test.dart` |
| Login | `login.component.spec.ts` | `login_screen_test.dart` |
| Shared layout | `empty-state`, `master-detail-layout`, `tenant-select`, etc. | `screen_test_harness.dart` helpers |

## E2E (requires running stack)

Playwright smoke is **not** part of `verify-clients` (needs API + web on `:8000`/`:4200`):

```powershell
node scripts/e2e-smoke.mjs
```

Recipe: `docs/dev/recipes/e2e-smoke.md` · CI: `.github/workflows/e2e-smoke.yml`

Mobile device integration skeleton: `clients/mobile/integration_test/m2_product_detail_test.dart` (local stack + emulator).

## Pitfalls

- **Windows PowerShell:** use `;` not `&&` — scripts live under `scripts/`.
- **Flutter PATH:** install stable SDK outside Downloads; see `docs/dev/local-environment.md`.
- **Mobile hangs:** never bare `pumpAndSettle` on entity/settings screens — use `test/support/screen_test_harness.dart`.
- **Web Material tests:** import `NoopAnimationsModule`.
- **Karma branch regressions:** `docs/dev/known-pitfalls.md` § NFR-003.

## Doc sync

After adding specs or changing verify scripts, update:

- `docs/dev/codebase-index.md` (Test files + Scripts tables)
- `docs/dev/recipes/add-coverage-gate.md` (cross-link)
- `.cursor/skills/emcap-testing/SKILL.md` if commands change
