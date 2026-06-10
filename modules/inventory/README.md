# Inventory Module

Reference business module for EMCAP Phase 5 (SDD §27, §30). Declares entities, workflows, reports, dashboards, and menus via `ModuleDefinition` only — **no platform core changes required**.

## Entities

| Code | Purpose |
|------|---------|
| `PRODUCT` | SKU, pricing, on-hand quantity, reorder threshold |
| `WAREHOUSE` | Warehouse master data (code, name, location) |

## Workflow

`STOCK_ADJUSTMENT` on `PRODUCT`: draft → submitted → approved / rejected, with escalation (24h), delegation, and SLA (48h) — same pattern as the demo module.

## Reports

| Code | Entity | Notes |
|------|--------|-------|
| `INVENTORY_VALUATION` | `PRODUCT` | SKU, name, unit price, quantity on hand |
| `LOW_STOCK` | `PRODUCT` | Intended filter: `quantity_on_hand <= reorder_level` |

## Dashboard

`INVENTORY_OVERVIEW` — KPI widgets for product counts, low stock, active products, and warehouse totals.

## Permissions

- `inventory.access`

## Loading

Export `MODULE` from `module.py`. Platform discovers modules under `EMCAP_MODULES_PATH` (see `deploy/manifest.yaml` for standalone deployment).

```bash
export EMCAP_MODULES_PATH=/path/to/modules   # contains inventory/module.py
```

When co-located in the monorepo, the default `modules/` root loads both `demo` and `inventory` automatically.
