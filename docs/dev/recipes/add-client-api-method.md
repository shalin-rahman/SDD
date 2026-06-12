# Recipe — Add client API method

Wire a platform endpoint into web and mobile clients.

## Checklist

1. **Web** — `clients/web/src/app/api/emcap-client.ts` — add typed method using `this.request()`
2. **Web contract test** — `clients/web/src/app/api/emcap-client.spec.ts` — add to `REQUIRED_METHODS`
3. **Mobile** — `clients/mobile/lib/api/emcap_client.dart` — add `_request()` wrapper method
4. **Shell UI** (optional) — `clients/web/src/app/pages/` or `clients/mobile/lib/app/`
5. **Mapping table** — `plan/04-client-api-completion.md` API-to-client table
6. **Traceability** — `spec/sdd/03-traceability-matrix.md` if new FR coverage
7. **Matrix 06** — if admin/product UI — `spec/sdd/06-admin-product-ui-matrix.md`
8. **Doc sync** — `docs/dev/recipes/sync-docs-after-change.md` (mandatory)

## Web method template

```typescript
listSomething(code: string): Promise<{ items: Record<string, unknown>[] }> {
  return this.request(`/api/v1/something/${code}`);
}
```

## Mobile method template

```dart
Future<List<Map<String, dynamic>>> listSomething(String code) async {
  final body = await _request('GET', '/api/v1/something/$code');
  return List<Map<String, dynamic>>.from(body['items'] as List);
}
```

## Verify

```powershell
cd clients/web; npm run lint; npm test
cd platform/api; python -m pytest -q tests/test_client_api_gaps.py
```
