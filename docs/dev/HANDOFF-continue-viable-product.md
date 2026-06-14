# Continue here — standard product (new chat handoff)

**Copy into a new Cursor chat** to continue without re-exploring the repo.

**Last updated:** 2026-06-14  
**Backlog:** see progress table in `plan/03-task-backlog.md` (~245 Done / ~47 Pending / ~14 Partial)  
**Do not commit** unless user explicitly asks.

---

## Read first (order)

1. `docs/dev/codebase-index.md`
2. `docs/product/user-feedback-registry.md` (§A–F, §L)
3. `docs/dev/session-memos/2026-06-14-conversation-architecture-memory.md`
4. `plan/20-standard-entity-rollout.md` — W1–W5 entity rollout
5. `plan/17-viable-product-execution-playbook.md` §4 sprint order
6. `docs/dev/known-pitfalls.md` if debugging

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

### Admin security (2026-06-14)

- Field overrides: `PUT /admin/security/field-access` · UI `/app/admin/security`
- ABAC: `PUT /admin/security/abac`

---

## Milestones (matrix 07)

| Milestone | Status |
|-----------|--------|
| **M1** PRODUCT web | Signed |
| **M2** PRODUCT mobile | Open — Flutter blocked locally |
| **M4** Inventory web | Signed |
| **M5** Platform + CRM | Partial |
| **M6** Admin/settings | Partial |

---

## Recently Done (uncommitted)

- **P15-T15/T17** — separate entity list/record web + mobile
- **P13-T10/T11** — field `read_roles` override API
- **P19-T01/T02/T03** — settings IA, admin users/roles, field security UI
- **P19-T05/T06** — branding preview + document settings (Partial)
- **P15-T22/T23** — loading/empty web + mobile
- **P18-T04/T05** — PRODUCT workflow, report menus
- **W5** stock movement entities + UX

---

## Do next

| Priority | Task | Blocker |
|----------|------|---------|
| 1 | P15-T13 / P20-T03 M2 mobile PNGs | Flutter SDK |
| 2 | P18-T06 CRM mobile Product-ready | Flutter device |
| 3 | P19-T04–T12 admin depth | — |
| 4 | P15-T21 WAREHOUSE/CRM polish | — |
| 5 | P15-T14 mobile SSE | — |

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

> Continue EMCAP from `docs/dev/HANDOFF-continue-viable-product.md`. Separate list/record entity UX; no commit before review. Proceed on [P19 admin / M2 mobile / P15-T21] without asking.
