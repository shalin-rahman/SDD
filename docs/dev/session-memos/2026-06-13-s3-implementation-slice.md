# S3 implementation slice — tokens, profile hub, entity states, mobile restore

**Date:** 2026-06-13  
**Sprint:** S3 partial + P17-T08 + P14-T14 + P15-T22/T23

## What changed

| Area | Paths |
|------|-------|
| Design tokens | `clients/web/src/styles/_tokens.scss`, `styles.scss` |
| Account profile hub | `clients/web/src/app/pages/account/*` — removed dev dump |
| Entity loading/retry | `entity.component.ts/html` |
| Empty grid + New CTA | `dynamic-data-grid.component.*` |
| Soft delete UX (web) | `deleteRecord` keeps selection for restore |
| Mobile restore | `emcap_client.dart`, `entity_screen.dart` |
| i18n | `en.json`, `fr.json`, `bn.json` |

## Verification

- `npm run build` — OK (bundle budget warning)
- `pytest test_system_fields.py test_inventory_e2e.py` — 18 passed

## Open follow-ups

- M1 screenshots (S1) — manual
- P16-T03 Flutter ThemeExtension
- P17 workflow inbox, document preview
- Lazy routes (P20-T06)
