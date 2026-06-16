# Recipe — CI coverage gate (NFR-003 / NFR-004)

## Checklist

1. `platform/api/pyproject.toml` — ensure `[tool.coverage.run]` source = `src`.
2. `.github/workflows/ci.yml` — `pytest --cov=src --cov-fail-under=80 -q` in `api-test` job.
3. Ratchet: Phase 7 used 70%; Phase 8 raised to **80%** (current API gate).
4. **Web (Karma):**
   - `clients/web/angular.json` — `test.configurations.coverage` with `"codeCoverage": true`
   - `clients/web/karma.conf.js` — `coverageReporter` + baseline `check.global` thresholds (ratchet toward 80%)
   - `clients/web/package.json` — `"test:coverage": "ng test --configuration=coverage"`
   - `.github/workflows/ci.yml` — `npm run test:coverage` after `npm run test:ci`
5. Mobile: `flutter test --coverage` when Flutter coverage gate is added (not yet enforced).

## Verify

```powershell
cd platform/api
python -m pytest --cov=src --cov-report=term-missing --cov-fail-under=80 -q

cd clients/web
npm run test:ci
npm run test:coverage
```

Coverage output: `clients/web/coverage/web/` (HTML + `lcov.info`). Baseline thresholds (Sprint 12, 2026-06-16): statements 58%, branches 41%, functions 51%, lines 58% — **241 Karma specs**; target 80% remains Sprint 13+.

Mobile: `flutter test --coverage` in CI (`clients/mobile/coverage/lcov.info`); baseline gate TBD.

## Layout override unit tests

```powershell
cd platform/api
python -m pytest tests/test_layout_merge.py tests/test_layout_override.py -q
```

Target: `layout_merge.py` and `layout_service.py` each **≥80%** (currently ~97% / ~91%).
