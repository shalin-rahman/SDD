# Recipe — Start workflow from record

## Checklist

1. Client: `startWorkflow(workflowCode, { recordId })` — `POST /workflows/{code}/start`.
2. Record detail — button when entity metadata has workflow enabled.
3. Inventory: `STOCK_ADJUSTMENT` on PRODUCT record.
4. Inbox — show `due_at`, `sla_hours` from instance payload.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_inventory_e2e.py -k workflow
```
