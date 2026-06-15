# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-15  
**Backlog:** see progress table in `plan/03-task-backlog.md` (~268 Done / ~50 Pending / ~4 Partial)  
**Do not commit** unless user explicitly asks.

---

## Read first (tiered)

### Tier 1 — Always (canonical)

1. `docs/dev/codebase-index.md`
2. `docs/product/user-feedback-registry.md` — §A standing orders, §M security/memory tiers

### Tier 2 — Sprint context

3. `docs/dev/HANDOFF-continue-standard-product.md` (this file)
4. `plan/20-standard-entity-rollout.md` — W1–W5 entity rollout
5. `plan/03-task-backlog.md` — Crash course section
6. `plan/17-standard-product-execution-playbook.md` §4 sprint order

### Tier 3 — Historical (verify before trusting paths)

7. `docs/dev/session-memos/2026-06-14-conversation-architecture-memory.md`
8. `docs/dev/known-pitfalls.md` when debugging

**Memo trust rule:** Session memos are audit trail only. If a memo references `entity.component.*`, `entity_screen.dart`, or master–detail entity UX, treat as **stale** — use Tier 1 paths (`entity-list` / `entity-record`, mobile push nav).

---

## Architecture (memorize)

| Layer | Path |
|-------|------|
| Business | `modules/` only |
| Platform API | `platform/api/src/emcap/` |
| Web shared UI | `clients/web/src/app/shared/` |
| Web pages | `clients/web/src/app/pages/` (thin) |
| Mobile | `clients/mobile/lib/app/` |

### Entity UX — separate list / record (C15, Slice 15C Done)

| | Web | Mobile |
|---|-----|--------|
| **List** | `/app/entity/:code` → `entity-list` | `entity_list_screen.dart` |
| **Record** | `/new`, `/:recordId` → `entity-record` | push `entity_record_screen.dart` |

**Not required:** grid columns on entry form (C16 rejected, P15-T16 cancelled).

### Admin security (2026-06-14+)

- Field overrides: `PUT /admin/security/field-access` · UI `/app/admin/security`
- Metadata filter: `GET /metadata/forms|grids/{entity}` applies `read_roles` + overrides (P23-T01)
- Web defense in depth: `field-security.util.ts` hides fields absent from secured record (P23-T02)
- ABAC: `PUT /admin/security/abac` + `checkAuth` test preview (P19-T04 Done; deny-path P23-T04)

---

## Milestones (matrix 07)

| Milestone | Status |
|-----------|--------|
| **M1** PRODUCT web | Signed |
| **M2** PRODUCT mobile | Open — Flutter blocked locally |
| **M4** Inventory web | Signed |
| **M5** Platform + CRM | Partial |
| **M6** Admin/settings | Partial — Phase 12 backlog Done (Wired); product polish P19-T05/T06 |

---

## Recently Done (uncommitted)

- **Phase 12 close-out** — P12B-T09, P12C-T02/T07/T12/T16/T19, P12D-T05 → Done; security read-only cards web+mobile; NG5002/`override_paths` pitfalls documented
- **P23-T04** — ABAC `evaluate_abac` resource-context fix + deny-path pytest green
- **P23-T03** — `git rm --cached` for tracked `*.db` files
- **P19-T04/T09–T12** — ABAC complete; settings overrides/reload; integrations/payments/templates product UX
- **P16-T09** — entity list/record breadcrumbs via `PageHeaderComponent`
- **P23-T01/T02** — metadata field security filter + web entity-record defense
- **P20-T20/T21** — STOCK_MOVEMENT post button + movement lines panel
- **P21-T06** — mobile `updateAdminFieldAccess` client + contract test
- **P22-T01–T06** — doc integrity: entity route refs, §M standing orders, skill sync
- **P15-T15/T17** — separate entity list/record web + mobile
- **P13-T10/T11** — field `read_roles` override API
- **P19-T01/T02/T03** — settings IA, admin users/roles, field security UI
- **W5** stock movement entities + UX

---

## Do next

| Priority | Task | Blocker |
|----------|------|---------|
| 1 | P15-T13 / P20-T03 M2 mobile PNGs | Flutter SDK |
| 2 | P18-T06 CRM mobile Product-ready | Flutter device |
| 3 | P19-T05/T06 branding + document settings **product** polish (07 gate) | — |
| 4 | P16-T05 web component standardization | — |
| 5 | P15-T21 WAREHOUSE/CRM polish | — |

---

## Local dev

```bat
scripts\start-emcap-local.bat
```

Login: `admin` / `admin123` · Web: http://localhost:4200 · Logs: `logs/emcap/web.log`

**Seed:** use stack restart (SQLite); bare `apply-seed.py` needs `DATABASE_URL`.

---

## Verification

```bat
cd platform\api && python -m pytest tests/test_entity_system_contract.py tests/test_admin_field_access_override.py -q
cd clients\web && npm run test:ci
node scripts/capture-m1-screenshots.mjs
node scripts/capture-screenshot-sprint.mjs --only=entity-packs
```

---

## Suggested prompt

> Continue EMCAP from `docs/dev/HANDOFF-continue-standard-product.md`. Separate list/record entity UX; no commit before review. Proceed on [P19 admin / M2 mobile / P23-T03] without asking.
