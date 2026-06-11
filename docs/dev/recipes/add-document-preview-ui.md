# Recipe — Document preview + download

## Checklist

1. Wire `getDocument(id)` on document row click.
2. Text files — show content snippet; images — `<img>` from base64 if API returns.
3. Download link from storage key or API content field.
4. Display `version`, `virus_scan_status` in list.
5. Mobile — `ListTile` tap opens dialog or external viewer.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_platform_services.py -k document
```
