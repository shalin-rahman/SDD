# Recipe — Notifications UI

## Checklist

1. Confirm `modules.notifications.enabled: true` in `config/platform.yaml`.
2. Client: `listNotifications()`, `sendNotification({ channel, to, subject, body })`.
3. Web/mobile nav entry **Notifications**.
4. Read-only list + simple send form (admin demo).
5. Update `04-capability-matrix.md` notifications row.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_platform_services.py -k notification
```
