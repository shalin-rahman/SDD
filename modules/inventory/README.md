# Inventory Module

Reference business module for EMCAP Phase 5 (SDD §27, §30). Declares entities, workflows, reports, dashboards, and menus via `ModuleDefinition` only — **no platform core changes required**.

## Entities

| Code | Purpose |
|------|---------|
| `PRODUCT` | SKU, pricing, on-hand quantity, reorder threshold |
| `WAREHOUSE` | Warehouse master data (code, name, location) |
| `STOCK_MOVEMENT` | Stock movement header (movement_type, warehouses, draft/posted/cancelled) |
| `STOCK_MOVEMENT_LINE` | Movement lines (product, quantity, unit cost) |

## Stock movement posting (W5)

Business rules live in `stock_movement.py`:

- `validate_stock_movement_payload` — transfer requires `source_warehouse_id`; draft→posted transition only.
- `apply_posted_movement` — updates product-level `quantity_on_hand` (receive/return/bonus +; gift/damage/lost/issue −; transfer net-zero at product level; adjustment + until line direction exists).
- Wired via `ENTITY_VALIDATORS` on `STOCK_MOVEMENT` update; platform passes optional `context` with repo/registry for atomic post.

**Design note:** Per-warehouse balances are not modeled yet — `warehouse_id` / `source_warehouse_id` are document context; transfers do not change total product qty until warehouse-level inventory is added.

## Workflow

`STOCK_ADJUSTMENT` on `PRODUCT`: draft → submitted → approved / rejected, with escalation (24h), delegation, and SLA (48h) — same pattern as the demo module.

## Reports

| Code | Entity | Notes |
|------|--------|-------|
| `INVENTORY_VALUATION` | `PRODUCT` | SKU, name, unit price, quantity on hand |
| `LOW_STOCK` | `PRODUCT` | Intended filter: `quantity_on_hand <= reorder_level` |
| `STOCK_MOVEMENT_HISTORY` | `STOCK_MOVEMENT` | Movement number, type, warehouse, status, date |

## Demo seed

Demo stock movements live in `data/seed/demo/stock_movements.json` (draft + posted receive/issue/transfer with lines). Requires `data/seed/demo/warehouses.json` (two sites) and `products.json` for lookup IDs. Seed loader inserts directly — posted demo rows do not trigger `apply_posted_movement`.

## Dashboard

`INVENTORY_OVERVIEW` — KPI widgets for product counts, low stock, active products, and warehouse totals.

## Menus (entities + standard reports)

| Menu code | Target |
|-----------|--------|
| `products` | Entity `PRODUCT` |
| `warehouses` | Entity `WAREHOUSE` |
| `stock_movements` | Entity `STOCK_MOVEMENT` |
| `low_stock` | Report `LOW_STOCK` |
| `inventory_valuation` | Report `INVENTORY_VALUATION` |
| `stock_movement_history` | Report `STOCK_MOVEMENT_HISTORY` |

Report menus use `MenuDefinition.report_code`; web shell routes to `/app/reports?code=…`.

## Permissions

- `inventory.access`

## Loading

Export `MODULE` from `module.py`. Platform discovers modules under `EMCAP_MODULES_PATH` (see `deploy/manifest.yaml` for standalone deployment).

```bash
export EMCAP_MODULES_PATH=/path/to/modules   # contains inventory/module.py
```

When co-located in the monorepo, the default `modules/` root loads both `demo` and `inventory` automatically.
