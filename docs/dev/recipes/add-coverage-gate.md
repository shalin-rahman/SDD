# Recipe — CI coverage gate (NFR-003 / NFR-004)

## Checklist

1. `platform/api/pyproject.toml` — ensure `[tool.coverage.run]` source = `src`.
2. `.github/workflows/ci.yml` — add step:
   ```yaml
   run: pytest --cov=src --cov-fail-under=80 -q
   ```
3. Ratchet: if below 80%, set `--cov-fail-under=70` temporarily; document in `plan/06-sdd-gap-closure.md`.
4. Web: `"test:coverage": "vitest run --coverage"` in `package.json`.
5. Mobile: `flutter test --coverage` when Flutter in CI.

## Verify

```powershell
cd platform/api; python -m pytest --cov=src --cov-report=term-missing -q
```
