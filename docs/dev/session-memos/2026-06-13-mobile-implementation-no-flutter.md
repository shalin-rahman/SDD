# Mobile implementation slice (no Flutter runtime)

**Date:** 2026-06-13  
**Tasks:** P14-T13 mobile, P17-T02, P17-T07 (Partial)

## Flutter

Not on PATH — **no `flutter test` / run**. Unit test files added for CI when SDK available.

## Code landed

| Path | Change |
|------|--------|
| `clients/mobile/lib/metadata_contract.dart` | `DisplayMetadata`, `StatusFieldMetadata`, `FormMetadata.display` |
| `clients/mobile/lib/utils/status_chip_util.dart` | Metadata-driven chip (parity web) |
| `clients/mobile/lib/app/entity_screen.dart` | Uses `buildStatusChipView`; doc preview dialog |
| `clients/mobile/lib/utils/workflow_sla_util.dart` | SLA levels |
| `clients/mobile/lib/app/workflow_inbox_screen.dart` | Filters, SLA chips, confirm dialogs, detail |
| `clients/mobile/lib/widgets/document_preview_dialog.dart` | P17-T07 — no raw alert for preview |
| `clients/mobile/test/*_test.dart` | status_chip, workflow_sla, metadata display parse |
| `clients/mobile/assets/i18n/*.json` | workflow filter/SLA + document.preview keys |

## Backlog

- P14-T13 → **Done**
- P17-T02, P17-T07 → **Partial** (screenshot/run when Flutter installed)

## Verify (when Flutter available)

```bat
cd clients\mobile
flutter pub get
flutter test
```
