# Recipe — CI coverage gate (NFR-003 / NFR-004)

## Checklist

1. `platform/api/pyproject.toml` — ensure `[tool.coverage.run]` source = `src`.
2. `.github/workflows/ci.yml` — `pytest --cov=src --cov-fail-under=80 -q` in `api-test` job.
3. Ratchet: Phase 7 used 70%; Phase 8 raised to **80%** (current API gate, ~91% in CI).
4. **Web (Karma):**
   - `clients/web/angular.json` — `test.configurations.coverage` with `"codeCoverage": true`
   - `clients/web/karma.conf.js` — `coverageReporter` + `check.global` thresholds (Sprint 14: **80% branches**)
   - `clients/web/package.json` — `"test:coverage": "ng test --configuration=coverage"`
   - `.github/workflows/ci.yml` — `npm run test:coverage` after `npm run test:ci`
5. Mobile:
   - `flutter test --coverage` in CI
   - `scripts/check-flutter-coverage.py --lcov clients/mobile/coverage/lcov.info --min 80` after tests

## Verify

```powershell
cd platform/api
python -m pytest --cov=src --cov-report=term-missing --cov-fail-under=80 -q

cd clients/web
npm run test:ci
npm run test:coverage

cd clients/mobile
flutter test --coverage
python ../../scripts/check-flutter-coverage.py --lcov coverage/lcov.info --min 80
```

Coverage output: `clients/web/coverage/web/` (HTML + `lcov.info`).

**Baselines (2026-06-16):** Karma **417** specs; branches **80.14%** (973/1214) gate **80%** (`karma.conf.js` `check.global`).

Mobile: `clients/mobile/coverage/lcov.info`; CI enforces **80%** line coverage via `scripts/check-flutter-coverage.py`.

## Web branch coverage strategy

Prioritize branch hits where conditionals cluster (extend **existing** `*.spec.ts` files — do not add one-off harness specs):

| Area | Spec file(s) | Notes |
|------|----------------|-------|
| Entity record | `entity-record.component.spec.ts` | `restoreRecord` async, post movement, create/delete nav, validation |
| Settings | `settings.component.spec.ts` | Payments, integrations, isolation ops, branding |
| Workflow inbox | `workflow.component.spec.ts` | SLA labels need `due_at` on instance |
| Entity list | `entity-list.component.spec.ts` | Pagination (`DEFAULT_PAGE_SIZE=10`), CSV export errors |
| Admin security | `admin-security.component.spec.ts` | ABAC matrix branches, field access |
| Reports | `reports.component.spec.ts` | Schedule label uses i18n key `platform.reports.noSchedule` |
| Document preview | `document-preview.util.spec.ts` | Mime/version/download branches |
| Form renderer | `dynamic-form.renderer.spec.ts` | Condition operators (`equals` + boolean) |
| Metadata contract | `metadata/contract.spec.ts` | Label fallbacks (`??` vs empty string) |
| Shared utils | `export.util.spec.ts`, `workflow-sla.util.spec.ts`, `permission.util.spec.ts` | High branch ROI |

**Patterns:**

- Call **public component methods** directly to hit both sides of `if` / `switch` (e.g. `selectPaymentProvider`, `reload`, `canPostMovement`).
- For router navigation specs, register **list + record** routes (`app/entity/:code` and `app/entity/:code/:recordId`).
- After async lifecycle (`restoreRecord`, API mocks), `await fixture.whenStable()` before assertions.
- Do **not** spy ES module exports (`exportUtil.downloadCsv`) — assert observable component state instead.

**Recurring spec mistakes:** `docs/dev/known-pitfalls.md` § **NFR-003 — Web Karma branch coverage**.

## Layout override unit tests

```powershell
cd platform/api
python -m pytest tests/test_layout_merge.py tests/test_layout_override.py -q
```

Target: `layout_merge.py` and `layout_service.py` each **≥80%** (currently ~97% / ~91%).
