# Recipe — Workflow actions in client shells

## Checklist

1. Read API routes in `platform/api/src/emcap/api/routes/workflows.py` for transition/delegate paths.
2. Add client methods (web + mobile) — follow `add-client-api-method.md`.
3. Extend `workflow_inbox_screen.dart` / web `renderWorkflowInbox` with action buttons.
4. On success, reload instance list.
5. Update `plan/04-client-api-completion.md` mapping.
6. Update `spec/sdd/04-capability-matrix.md` workflow row → Done.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_inventory_e2e.py -k workflow
cd clients/web; npm test
```
