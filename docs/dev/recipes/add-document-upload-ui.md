# Recipe — Document upload in client shells

## Checklist

1. API: `POST /api/v1/documents/upload` — body `{ entity_code, record_id, filename, content }`.
2. Web: `uploadDocument()` in `emcap-client.ts`; file input reads text/small files as string.
3. Mobile: same method; use `file_picker` only if added to pubspec — else text field for scaffold.
4. Wire on record detail panel after `listDocuments`.
5. Update capability matrix documents row.

## Pitfall

Large files — SDD virus scan hook is API-side; keep upload size reasonable in UI validation.

## Verify

```powershell
cd platform/api; python -m pytest -q tests/test_client_api_gaps.py::test_document_list_by_record
```
