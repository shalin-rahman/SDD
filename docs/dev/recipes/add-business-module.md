# Recipe — Add business module

SDD §27–§30 plug-in model. **Zero edits to `platform/api/src/emcap/`.**

## Checklist

1. **Module definition** — `modules/<name>/module.py` exporting `MODULE: ModuleDefinition`
   - Entities, workflows, reports, dashboards, menus, permissions
2. **Deploy manifest** — `modules/<name>/deploy/manifest.yaml`
3. **Decision record** — `modules/<name>/DECISION.md` (optional but recommended)
4. **E2E tests** — `platform/api/tests/test_<name>_e2e.py`
5. **DoD sign-off** — `docs/modules/<name>-definition-of-done.md`
6. **Verify core unchanged** — `scripts/verify-platform-core.ps1`

## Allowed imports in module.py

- `emcap.entity.*`
- `emcap.module.*`
- `emcap.reporting.*`
- `emcap.workflow.*`

## Verify

```powershell
cd platform/api
python -m pytest -q tests/test_<name>_e2e.py tests/test_platform_core_unchanged.py
.\scripts\verify-platform-core.ps1
```
