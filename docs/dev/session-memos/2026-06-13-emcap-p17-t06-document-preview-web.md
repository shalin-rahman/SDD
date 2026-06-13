# P17-T06 — Document preview (web)

**Date:** 2026-06-13  
**Task:** EMCAP-P17-T06  
**Scope:** Web Angular only

## Goal

Replace `window.alert` document preview with a shared side panel: inline PDF/image when content is available, text snippet for text files, download CTA for other types, virus-scan badge, version list when API returns versions.

## Decisions

- **Side panel** (fixed overlay, right-aligned) rather than MatDialog — matches master-detail UX without new dialog service wiring.
- **Content handling:** API currently returns truncated hex in `content_base64`; text preview uses `ocr_text`. Full binary inline preview activates when API returns decodable base64/hex above minimum length.
- **Versions:** Dropdown only when `versions` array present on getDocument payload; otherwise static version label from list row.
- **No backend changes** in this task.

## Changed

| Path | Change |
|------|--------|
| `clients/web/src/app/shared/documents/` | `DocumentPreviewPanelComponent` + spec |
| `clients/web/src/app/shared/utils/document-preview.util.ts` | Mime, preview mode, download, virus badge |
| `clients/web/src/app/shared/entity/record-tabs.*` | i18n preview button, virus badge in list |
| `clients/web/src/app/pages/entity/` | Wire panel; remove `window.alert` |
| `clients/web/src/assets/i18n/{en,fr,bn}.json` | Document preview strings |
| `spec/sdd/07-product-readiness-matrix.md` | Document preview → Demo |
| `plan/03-task-backlog.md` | P17-T06 Done, counts 222/298 |
| `docs/dev/codebase-index.md` | Shared documents path + specs |
| `docs/dev/HANDOFF-continue-viable-product.md` | S7 next = P17-T07 mobile |

## Verification

```bat
cd clients\web
npm run test:ci -- --include=**/document-preview*.spec.ts
npm run build
```

## API gaps

- `getDocument` returns truncated content hex — full PDF/image inline preview needs full file bytes in API response.
- No dedicated download endpoint; client builds blob from available payload fields.

## Follow-ups

- P17-T07 document preview mobile parity
- Optional: `GET /documents/{id}/content` or full base64 in get response for inline binary preview
