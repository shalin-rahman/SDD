# Recipe — Add report UI (web + mobile)

Generic report runner — no inventory-specific platform routes.

## API (already exists)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/reports` | List report codes |
| `POST /api/v1/reports/{code}/run` | Execute report → `{ report_code, rows, ... }` |

LOW_STOCK filter is defined in Inventory module + `emcap/reporting/service.py`.

## Checklist

1. **Web client** — `listReports()`, `runReport(code)` in `emcap-client.ts`
2. **Web contract** — add methods to `emcap-client.test.ts` `REQUIRED_METHODS`
3. **Web shell** — Reports nav view: list reports, run selected, render `rows` table
4. **Mobile client** — `listReports()`, `runReport(code)` in `emcap_client.dart`
5. **Mobile shell** — `report_screen.dart` + NavigationRail entry
6. **Docs** — `plan/04-client-api-completion.md` mapping row for LOW_STOCK

## Web runReport template

```typescript
listReports(): Promise<{ reports: string[] }> {
  return this.request("/api/v1/reports");
}

runReport(reportCode: string): Promise<{ report_code: string; rows: Record<string, unknown>[] }> {
  return this.request(`/api/v1/reports/${reportCode}/run`, { method: "POST" });
}
```

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_client_api_gaps.py::test_low_stock_report_filter
cd clients/web; npm run lint; npm test
```

Manual: login → Reports → run LOW_STOCK → table shows only low-stock SKUs.
