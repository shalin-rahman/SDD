# S2 / M2 — mobile screenshot prep (Flutter blocked)

**Date:** 2026-06-13  
**Tasks:** EMCAP-P15-T13, EMCAP-P20-T03 (Partial)  
**Sprint:** S2 (viable product critical path)

## Goal

Advance M2 mobile gate despite Flutter SDK not on local PATH.

## Flutter availability

| Check | Result |
|-------|--------|
| `where flutter` | Not found |
| `FLUTTER_ROOT` / `FVM` env | Not set |
| Common paths (`C:\flutter`, `%LOCALAPPDATA%\flutter`, etc.) | Not present |

**Blocked locally:** `flutter pub get`, `flutter test`, app run, PNG capture.

## What changed

| Path | Change |
|------|--------|
| `scripts/capture-m2-mobile-screenshots.md` | M2 runbook: install, stack, tests, manual + automated capture |
| `clients/mobile/integration_test/m2_product_detail_test.dart` | Integration test skeleton for PRODUCT detail hero |
| `clients/mobile/pubspec.yaml` | `integration_test` dev dependency |
| `docs/dev/known-pitfalls.md` | M2 unblock points to runbook |
| `plan/03-task-backlog.md` | P15-T13, P20-T03 → Partial |
| `plan/15-entity-page-redesign.md` | P15-T13 → Partial |
| `docs/dev/HANDOFF-continue-viable-product.md` | S2 status updated |
| `docs/dev/codebase-index.md` | New script + integration_test paths |

## Mobile code review (M2 checklist)

No `entity_screen.dart` changes required:

- **Hero:** `_recordHeadline()` — `SKU — Name` for PRODUCT
- **Chip:** `_statusChipLabel()` + `Chip` in detail header
- **System section:** `_buildSystemSection()` (visible in edit mode)
- **Grid:** `formatGridCellValue()` datetime formatting

## Verification

Not run (no Flutter SDK):

```powershell
cd clients\mobile
flutter pub get
flutter test test\metadata_contract_test.dart
```

## Open follow-ups

1. Install Flutter SDK → run runbook §3–5 → save `docs/product/screenshots/phase15-mobile-product-detail.png`
2. Mark P15-T13 / P20-T03 Done + sign M2 in `07-product-readiness-matrix.md`
3. Complete integration_test screenshot binding (TODO in test file)
4. P15-T14 mobile SSE (S2 remainder)

No git commit until user review.
