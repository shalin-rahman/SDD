# EMCAP SDD — Session Summary

## Phase 5 complete

**51 tests passing** (1 skipped: git guard when not a repo). Reference Inventory module shipped via plug-in model only — no edits to `platform/api/src/emcap/`.

### Inventory module

| Area | Path |
|------|------|
| Module definition | `modules/inventory/module.py` |
| Deploy manifest | `modules/inventory/deploy/manifest.yaml` |
| Decision record | `modules/inventory/DECISION.md` |
| DoD sign-off | `docs/modules/inventory-definition-of-done.md` |
| E2E API tests | `platform/api/tests/test_inventory_e2e.py` |
| Core unchanged guard | `platform/api/tests/test_platform_core_unchanged.py` |
| Verify scripts | `scripts/verify-platform-core.sh`, `scripts/verify-platform-core.ps1` |

**Entities:** `PRODUCT`, `WAREHOUSE` · **Workflow:** `STOCK_ADJUSTMENT` · **Reports:** `INVENTORY_VALUATION`, `LOW_STOCK` · **Dashboard:** `INVENTORY_OVERVIEW`

### Key inventory API surface (auto-generated)

```
GET  /api/v1/entities/PRODUCT|WAREHOUSE/records
POST /api/v1/entities/PRODUCT|WAREHOUSE/records
GET  /api/v1/metadata/forms/PRODUCT
GET  /api/v1/metadata/grids/PRODUCT
POST /api/v1/workflows/STOCK_ADJUSTMENT/start
GET  /api/v1/reports/INVENTORY_VALUATION/runs
GET  /api/v1/dashboards
GET  /api/v1/menus
```

### Backlog

**85 / 85** tasks Done. All phases complete.

### Cursor (project-local)

Skills and rules for this repo only — see `.cursor/README.md`. Do not depend on user-global `~/.cursor/skills-cursor/` for EMCAP work.

---

## Phase 4 — DevOps & production (prior)

| Workflow | Trigger | Environment |
|----------|---------|-------------|
| `.github/workflows/deploy-dev.yml` | push `develop`, `workflow_dispatch` | `dev` |
| `.github/workflows/deploy-uat.yml` | push `release/*`, `workflow_dispatch` | `uat` (approval gate) |
| `.github/workflows/deploy-production.yml` | tag `v*.*.*`, `workflow_dispatch` rollback/deploy | `production` |

DR: PITR + daily backup automation; semver release process documented in `docs/ops/release-process.md`.

### Cleanup complete (Phase 0)

- **P0-T07:** `clients/web` ESLint + `clients/mobile` Flutter analyze in CI
- **P0-T05:** `scripts/setup-branch-protection.{sh,ps1}` — run after GitHub push
