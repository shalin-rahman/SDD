# Recipe — Renderer contract tests + coverage 80%

## Checklist

1. `clients/web/src/dynamic-form.component.test.ts` — required, types, conditions.
2. `clients/web/src/dynamic-grid.component.test.ts` — sort, filter, export flags.
3. `clients/web/package.json` — `"test:coverage": "vitest run --coverage"`.
4. CI: ratchet `--cov-fail-under=80` in `.github/workflows/ci.yml`.
5. Flutter: `test/metadata_contract_test.dart` for parity.

## Verify

```powershell
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run test:coverage
```
