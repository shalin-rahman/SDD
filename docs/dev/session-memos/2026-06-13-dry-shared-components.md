# DRY refactor — shared layout components + record utils

**Date:** 2026-06-13

## Goal

Consolidate duplicated loading/empty/card/headline logic into `shared/` per DRY/SOLID.

## Added

| Item | Path |
|------|------|
| `LoadingPanelComponent` | `shared/layout/loading-panel.component.*` |
| `EmptyStateComponent` | `shared/layout/empty-state.component.*` |
| `SectionCardComponent` | `shared/layout/section-card.component.*` |
| Record lifecycle utils | `shared/utils/record-lifecycle.util.ts` + spec |
| Record headline util | `shared/utils/record-headline.util.ts` |

## Refactored

- Account, entity, grid, detail-placeholder → shared components
- Global `styles.scss` — removed page-specific classes; tokens only + `.profile-page`

## Handoff

`docs/dev/HANDOFF-continue-viable-product.md` for new chat.
