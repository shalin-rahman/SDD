# EMCAP Phase 5 — Inventory Reference Module (Sub-Agents)

## Goal

Complete Phase 5 with Inventory as reference module proving SDD §30 Definition of Done.

## Orchestration (3 parallel agents)

| Agent | Tasks | Deliverable |
|-------|-------|-------------|
| Module | P5-T01–T03 | `modules/inventory/` |
| E2E tests | P5-T04 | `test_inventory_e2e.py` + fixtures |
| DoD sign-off | P5-T05–T06 | DoD doc, verify scripts, core unchanged tests |

## Inventory module

- **Entities:** PRODUCT, WAREHOUSE
- **Workflow:** STOCK_ADJUSTMENT (on PRODUCT)
- **Reports:** INVENTORY_VALUATION, LOW_STOCK
- **Dashboard:** INVENTORY_OVERVIEW
- **Deploy:** `modules/inventory/deploy/manifest.yaml`

## Verification

```
pytest -q   # 51 passed, 1 skipped
ruff check src tests
```

## Result

Phase 5: 6/6 Done. Overall backlog: **83/85** (P0-T05 Partial, P0-T07 Pending only).

## Constraints

- No platform core changes (`platform/api/src/emcap/` untouched)
- No git commit
