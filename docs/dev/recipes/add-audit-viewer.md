# Recipe — Audit trail viewer

## Checklist

1. API: `GET /api/v1/entities/{entity}/audit` (optional `record_id` query if supported).
2. Client method `listAudit(entityCode, recordId?)`.
3. Show on record detail below notes/documents.
4. Read-only table: action, user, timestamp, changes.
5. Update capability matrix auditing row.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_health.py -k audit
```
