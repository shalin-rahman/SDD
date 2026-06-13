# EMCAP cleanup — P0-T05, P0-T07, .cursor consolidation

## Goal

Finish remaining Phase 0 tasks and keep project Cursor assets in-repo only.

## What changed

- **P0-T07:** `clients/web/package.json`, ESLint config; `clients/mobile/pubspec.yaml`, `analysis_options.yaml`; CI jobs `client-lint-web`, `client-lint-mobile`
- **P0-T05:** `scripts/setup-branch-protection.{sh,ps1}` + `docs/dev/gitflow.md` update
- **`.cursor/README.md`:** Index of project-local rules/skills (13 skills, 5 rules)
- **Backlog:** 85/85 Done
- **Test fix:** `test_platform_core_unchanged.py` skips git diff guard until initial commit exists

## Verification

```powershell
cd clients/web; npm ci; npm run lint
cd platform/api; pytest -q   # 51 passed, 1 skipped
```

## After push to GitHub

```powershell
.\scripts\setup-branch-protection.ps1
```

## Constraints

- No git commit (user review pending)
