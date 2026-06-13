# Continue here — viable product (new chat handoff)

**Copy this file into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-13  
**Backlog:** `222 / 298 Done` · `plan/03-task-backlog.md`  
**Do not commit** unless user explicitly asks.

---

## Read first (order)

1. `docs/dev/codebase-index.md`
2. `docs/product/user-feedback-registry.md`
3. `plan/20-standard-entity-rollout.md` — **W1 standard fields** (API · Web · Mobile · Tests)
4. `plan/17-viable-product-execution-playbook.md` §4 sprint order
4. `docs/dev/known-pitfalls.md` if debugging

---

## What this project is

EMCAP monorepo — enterprise multi-tenant platform. **Viable product** path (not “API Done = product”):

- **Product gate:** `spec/sdd/07-product-readiness-matrix.md` + `plan/16-product-ready-dod.md`
- **Execution:** Sprints S1–S15 in `plan/17-viable-product-execution-playbook.md`
- **Reference entity:** `PRODUCT` (Inventory) — **M1 web signed** 2026-06-13
- **M2 mobile:** **Partial** — `scripts/capture-m2-mobile-screenshots.md` + `integration_test/m2_product_detail_test.dart`; PNG capture needs Flutter SDK (see `known-pitfalls.md` Mobile → M2 blocked)

---

## What is already implemented (uncommitted)

### Entity platform (Phase 14)
- System fields in metadata + UI (`created_by`, `updated_at`, etc.)
- `updated_by`, `record_version`, `If-Match` → 409
- Soft delete + restore API + web/mobile UI
- `FieldType.ENUM` + web select
- Tests: `platform/api/tests/test_system_fields.py` (18 with inventory e2e)

### Entity UX (Phase 15)
- Web: hero header, section cards, grid polish, loading/retry, empty grid CTA
- Mobile: headline/chip parity, restore button
- Shared utils: `record-headline.util.ts`, `record-lifecycle.util.ts`
- Shared UI: `LoadingPanelComponent`, `EmptyStateComponent`, `SectionCardComponent`

### Design system (Phase 16 partial)
- `clients/web/src/styles/_tokens.scss` + ADR-006
- P16-T03 Flutter tokens **not done**

### Platform services (Phase 17 partial)
- **P17-T08 Done:** Account → profile hub (no dev dump)
- **P17-T01 Done:** Workflow inbox web
- **P17-T03 Done:** Reports catalog + run history + CSV download
- **P17-T04 Done:** Dashboard KPI card grid (web)
- **P17-T05 Done:** Notification center (web) — read/unread filter, channel icons, client-side mark-read
- **P17-T06 Done:** Document preview panel (web)
- **P17-T09 Done:** Assistant chat UX (web) — bubbles, suggestions, disabled state
- **P17-T11 Done:** Rule evaluate panel at `/app/settings/rules` (Settings → Rules link; not Account)
- **P17-T02 Partial:** Mobile workflow inbox (filters, SLA, dialogs) — code only
- **P17-T07 Partial:** Mobile document preview dialog — code only
- **Flutter run deferred** — see `scripts/capture-m2-mobile-screenshots.md`

### Docs in repo
- All session memos: `docs/dev/session-memos/` (35 files)
- Master index: `docs/README.md`, `docs/dev/recall-index.md`

---

## Critical path — do next

| Priority | Sprint | Tasks | Notes |
|----------|--------|-------|-------|
| ~~1~~ | ~~**S1 / M1**~~ | ~~P15-T06, P20-T02~~ | **Done** 2026-06-13 |
| — | **S2 / M2** | P15-T13, P20-T03 | **Partial** — runbook + integration_test skeleton; PNG capture blocked until Flutter SDK installed |
| — | **S3** | P16-T03 | **Skipped locally** — Flutter tokens |
| **1** | **S7 web** | P17-T07 mobile | P17-T06 web Done; mobile doc preview next |
| 2 | **S4** | P14-T13, T21–T26 | Status metadata, lookup fields |
| 3 | **S11+** | P19 | Admin depth (M1 unblocked) |

**Unblocked:** P19 admin (M1 web signed). Prefer S2 mobile before deep P19.

---

## Architecture rules (DRY / SOLID)

| Rule | Path |
|------|------|
| Business logic | `modules/` only |
| Platform API | `platform/api/src/emcap/` |
| Reusable web UI | `clients/web/src/app/shared/` — **pages stay thin** |
| New loading/empty/cards | Reuse `app-loading-panel`, `app-empty-state`, `app-section-card` |
| Record hero / soft delete | `record-headline.util.ts`, `record-lifecycle.util.ts` |
| i18n | EN/FR/BN in `clients/web/src/assets/i18n/` |
| Feature flags | `config/platform.yaml` |

---

## Local dev

```bat
scripts\run-emcap.bat --stack-only --local
```

Login: `admin` / `admin123` · Web: http://localhost:4200

After API schema changes: restart uvicorn; re-seed if needed.

---

## Verification commands

```bat
cd platform\api && python -m pytest tests/test_system_fields.py tests/test_inventory_e2e.py -q
cd clients\web && npm run build && npm run test:ci

rem M1 screenshot pack (stack must be running):
node scripts/capture-m1-screenshots.mjs
```

---

## Open product gaps (honest)

- ~~No M1 screenshots~~ → **M1 web signed**
- **M2 mobile deferred** — Flutter not installed on dev machine; code exists in `clients/mobile/`
- Workflow inbox web **Demo**; reports web **Demo**; docs still **Wired**
- Bundle budget warning ~1 MB (P20-T06 lazy routes later)
- PostgreSQL migrations for system columns (P21-T01)

---

## Suggested prompt for new chat

> Continue EMCAP viable product from `docs/dev/HANDOFF-continue-viable-product.md`. Follow sprint order, reuse `shared/` components, no commit before review. Start with [S1 screenshots OR P17 workflow inbox OR P16 Flutter tokens] — pick based on user preference.
