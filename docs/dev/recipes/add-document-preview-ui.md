# Recipe — Document preview + download

## Checklist

1. Use `DocumentPreviewPanelComponent` (`shared/documents/`) — do not `window.alert`.
2. Wire `getDocument(id)` via panel `open` + `document` inputs; entity page sets `previewingDocument`.
3. Text files — inline `<pre>` from `ocr_text`; images/PDF — blob URL when API returns decodable content.
4. Other types — download CTA via `triggerDocumentDownload`.
5. Display `version`, `virus_scan_status` in list (`RecordTabsComponent`) and preview header badge.
6. Version dropdown when API returns `versions` array on document payload.
7. i18n keys under `document.preview.*` and `record.previewDocument` (EN/FR/BN).

## Verify

```powershell
cd clients\web
npm run test:ci -- --include=**/document-preview*.spec.ts
npm run build
cd ..\..\platform\api
python -m pytest -q tests/test_platform_services.py -k document
```
