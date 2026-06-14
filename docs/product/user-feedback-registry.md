# User feedback registry — canonical memory

**Read this before product/UX planning or claiming “done.”**  
Agents: also read `docs/dev/codebase-index.md` and `plan/16-standard-viable-system.md`.

**Last consolidated:** 2026-06-14 (architecture memory + Slice 15C + P13/P19 admin slice)  
**Architecture memo:** `docs/dev/session-memos/2026-06-14-conversation-architecture-memory.md` · §L below  
**Update rule:** Add new user feedback here + link task ID in `plan/03-task-backlog.md`.

---

## Quick links

| Topic | Document |
|-------|----------|
| Master roadmap (API · web · mobile) | `plan/17-viable-product-execution-playbook.md`, `plan/16-standard-viable-system.md` |
| Product-ready DoD | `plan/16-product-ready-dod.md` |
| Honest UX status | `spec/sdd/07-product-readiness-matrix.md` |
| Platform wired (not product) | `spec/sdd/04-capability-matrix.md` |
| Pitfalls / error memory | `docs/dev/known-pitfalls.md` |
| Phase 12 item checklist | §B below (from full review memo) |

---

## A. Standing orders (process — every session)

| ID | User said | Required behavior |
|----|-----------|-------------------|
| A1 | Stop re-exploring codebase every time | Read `codebase-index.md`, skills, recipes first |
| A2 | Plans must be complete before coding | Follow task cards in `plan/*`; no improvisation |
| A3 | Memorize errors from fixes | `known-pitfalls.md` + regression test per fix |
| A4 | SDD-driven: docs sync with code | `emcap-doc-sync.mdc`, `sync-docs-after-change.md` |
| A5 | Close all Partial/No from SDD assessment | Phases 7–8 closed API gaps; UX gaps → Phase 14–21 |
| A6 | Learn from CI/local failures in tasks | Phase 11 scripts, pitfalls Phase 11 section |
| A7 | **Do not commit before my review** | No git commit unless user explicitly asks |
| A8 | Lint/format before test and build | `scripts/lint-format.bat`, CI order |
| A9 | `run-emcap.bat`: kill old processes, run stack, logs, seed, web | `scripts/run-emcap.bat`, `logs/emcap/` |
| A10 | Full Angular CLI web app (not Vite demo) | `clients/web/`, ADR-005; legacy in `web-legacy/` |
| A11 | Production seed + optional demo JSON (config removable) | `data/seed/`, `apply-seed.py` |
| A12 | “100%” / “all API done” ≠ product complete | Use matrix **07** for product; **04** for API wired |
| A13 | Review changes — none should look AI-generated | Minimal, convention-matching diffs |
| A14 | Useful tests only — no trivial assertions | `emcap-testing` skill |
| A15 | **Entity list and entry form are separate routes** — not master–detail on one page (supersedes B3 one-page pattern for entities) | Web: `entity-list` + `entity-record` · mobile: **P15-T17** |

---

## B. Phase 12 enterprise UI feedback (16 items)

| # | Requirement | Plan / task | Product status (07) |
|---|-------------|-------------|---------------------|
| B1 | Module-grouped menus | P12A, P12F, **P16-T09** | Web Partial; mobile Partial |
| B2 | Module on/off from settings | P12C, **P19-T09** (DB override clarity) | Wired |
| B3 | ~~List + edit one page (master–detail)~~ **Superseded 2026-06-14** — separate list + record routes (**A15**, **C15**, **P15-T15/T17**) | P12A, P15 Slice 15C | Web **Done** (`entity-list` / `entity-record`); mobile **Done** **P15-T17** |
| B4 | Responsive grids | P12A, P15-T04 | Demo |
| B5 | Multi-language (full pages, not toolbar only) | P12F, P15-T05, P17–P19 i18n | Partial |
| B6 | Theme light/dark + tenant primary | P12A, **P16-T02–T03** | Partial |
| B7 | User management (dedicated admin, not Account) | P12B, **P19-T02** | Wired |
| B8 | Role management | P12B, **P19-T02** | Wired |
| B9 | Permission setup editable | P12B picker, **P19-T03** field overrides | **Done** (web field matrix + API P13-T10) |
| B10 | Settings / configuration hub | P12C, **P19-T01** IA | Wired/Demo |
| B11 | Payment configuration | P12C, P12F secrets, **P19-T11** | Partial |
| B12 | Email templates CRUD UI | P12C-T04, **P19-T01** | Demo |
| B13 | Platform setups (workflow, grid, audit, tenant…) | P12C, **P19** | Toggle-heavy / Wired |
| B14 | Reusable shared components | `clients/web/src/app/shared/` | Done |
| B15 | Coverage ≥80% (backend); client gates | CI, **P20-T05** | API yes; web page specs thin |
| B16 | Mobile parity for Phase 12 | P12D, **P15-T10–T14**, M2 | Wired |

**UX fixes already applied (keep):** detail placeholder message; admin list/form panes; permission picker groups; settings nav refresh after save; no fake payment provider text field.

**Still open from Phase 12 review:** integrations/doc settings polish, full i18n catalogs, entity Material polish, per-file auth coverage below 80% (total gate passes).

---

## C. Product viability pivot (2026-06-12)

| ID | User critique | Response in plan |
|----|---------------|----------------|
| C1 | Entities lack **standard application attributes** | **W1** P14: system fields, version, soft delete, enum/lookup |
| C2 | `created_at`/`updated_at` on API but not in UI/metadata | P14-T03–T05 (web Done); mobile **P14-T30** |
| C3 | No `created_by`, version, soft delete, status lifecycle | P14-T10–T14, P14-T13 |
| C4 | UI is wiring, not professional / viable product | **W2** P15 + **W3** P16 |
| C5 | Account page is dev/demo (adapter tests) | **P17-T08** profile hub |
| C6 | Matrices mark Done when only API/pytest exists | **07** Wired/Demo/Product-ready; §A12 |
| C7 | Pause Phase 12/13 as “product complete” | Phase 13 → **P19** after **M1** |
| C8 | Move toward viable product, **not more admin toggles** | Critical path 14→15→17→18 before 19 |
| C9 | **PRODUCT** reference entity end-to-end first | M1–M2 milestones |
| C10 | Done needs **screenshot + UX criteria**, not pytest alone | `16-product-ready-dod.md`, P20 |
| C11 | Basic design/layout below standard | **W3** Material 3 tokens, P16 |
| C12 | Prepare **whole plan** for all services, web, mobile | `plan/16-standard-viable-system.md` W1–W8 |
| C13 | Memorize all feedback | **this file** |
| C14 | Inventory needs **standard stock movement types** (receive, return, gift, damage, lost, bonus, transfer, adjustment, issue, …) as first-class enum + transactional entity | **W5 Done (API+UX code)** — `STOCK_MOVEMENT` + `STOCK_MOVEMENT_LINE` · `apply_posted_movement` **P20-T19** · web Karma 115/115 + mobile contracts **P20-T18** · screenshot pack pending |
| C15 | **List page and entry page must be separated** — not a single master–detail view on one route | **Slice 15C Done** · **P15-T15** web · **P15-T17** mobile · `plan/15-entity-page-redesign.md` |
| C16 | ~~All grid columns must appear on the entry form~~ **Rejected 2026-06-14** — list grid and entry form are **separate surfaces**; form fields follow form metadata only (no forced `grid.keys ⊆ form.keys`) | ~~P15-T16~~ **Cancelled** |

---

## D. SDD / capability questions (user thread)

| Question | Answer recorded |
|----------|-----------------|
| Partial/No items — is there a plan? | Phase 7 closed API; product gaps → 14–21 |
| Where are we focusing? | Viable product path, not admin checklist |
| What else for full end-user per `framework-sdd.txt`? | Phase 8 + 12 + now 14–21; 04 vs 07 |
| Everything done from SDD — all APIs + web + mobile? | **API mostly Done** in 04; **product not** — honest in 06/07 |
| “Make it 100%” | API closure Phase 8–9; product closure is separate (07) |
| Full Angular CLI — why not / do it | Phase 10; `clients/web/` canonical |

---

## E. Local dev & tooling feedback

| ID | Issue / request | Fix / doc |
|----|-----------------|-----------|
| E1 | `run-emcap.bat` closes immediately; no web | Fixed stack + web + logs |
| E2 | Want logs while running for all services | `logs/emcap/*.log` |
| E3 | Lint before test/build | `lint-format.bat`, CI |
| E4 | CI `DATABASE_URL` / workflow YAML issues | P11-T08 |
| E5 | `docker` not on PATH | `--local` mode, skip compose in `stop-emcap.bat` |
| E6 | `ruff` not recognized | `pip install -e ".[dev]"` |
| E7 | Flake8 E501 in `apply-seed.py` | Line length fixes |
| E8 | Flutter not on PATH locally | CI mobile job; optional local |
| E9 | Check logs / browser when issues | Log triage: stale API, SQLite drift, JWT 401; **`logs/emcap/web.log`** for Angular compile errors |
| E10 | Summarize and memorize conversation | `docs/dev/session-memos/` + `docs/product/user-feedback-registry.md` §L |
| E11 | Architecture + handoff for new chats | `docs/dev/HANDOFF-continue-viable-product.md`, `2026-06-14-conversation-architecture-memory.md` |

---

## F. Entity UX pivot (2026-06-14)

| ID | User said | Required behavior | Tasks |
|----|-----------|-------------------|-------|
| F1 | List and entry are **separate pages**, not master–detail | Web: `/app/entity/:code` = grid only; `/app/entity/:code/:id` = record (new uses `/new`). Mobile: list screen → push detail route. Breadcrumbs back to list. | **P15-T15**, **P15-T17** |

**Not required:** grid columns duplicated on the entry form — grid is for browse/search on the list route; form fields follow form metadata on the record route (user clarified 2026-06-14).

**Keep from Slice 15A:** hero header, section cards, header actions, grid polish, i18n — grid polish on **list route**; header/form/tabs on **record route**.

**Screenshots:** M1 + entity-pack PNGs refreshed on separate routes (2026-06-14).

---

## G. Technical pitfalls (memorize — link to pitfalls doc)

| Symptom | Cause | Prevention |
|---------|-------|------------|
| Admin routes 404 | Stale uvicorn | Restart API after `platform/` changes |
| `no such column: users.active` | Old SQLite file | `init_db()` patches or delete DB + seed |
| Naive vs aware datetime | sync service | UTC normalize — test in gaps |
| SSE without auth | EventSource API | fetch + ReadableStream in web client |
| Circular import metadata/system_fields | cross-layer import | constants only in `entity/system_fields.py` |
| Angular strict template booleans | `string \| null` in template | `canX(): boolean` methods |
| Web build missing import | e.g. `FormMetadata` | build after entity changes |
| 401 bursts in api.log | Expired JWT | Re-login |
| Bundle budget warning | Material + entity chunk | **P20-T06** lazy routes |
| Client injects `created_at` | must reject | `test_reject_system_fields_in_create_payload` |

Full detail: `docs/dev/known-pitfalls.md`.

---

## H. SDD §2 services — product depth map

| Service | API (04) | Product workstream |
|---------|----------|-------------------|
| Authentication | Done | P17-T08 profile; login exists |
| Authorization | Done | P19-T02–T04; field security in UI P19-T03 |
| Multi-tenancy / white-label | Done | P19-T05 branding preview |
| Dynamic menus | Done | P18-T07 icons |
| Dynamic forms/grids | Done | **W1–W2** (core) |
| Workflow | Done | P17-T01–T02, P18-T04 |
| Reporting / dashboards | Done | P17-T03–T04, P18-T05 |
| Notifications | Done | P17-T05, P19-T12 SMS/push |
| Documents | Done | P17-T06–T07 (not `alert`) |
| Auditing | Done | Record tabs; polish P15-T22 |
| Integrations | Done | P19-T10 (not Account buttons) |
| Payments | Done | P19-T11 when enabled |
| Rules | Done | P17-T11 evaluate panel |
| AI | Flag-gated | P17-T09 |

---

## I. Gap tasks (feedback → backlog ID)

| Gap | Task ID |
|-----|---------|
| Mobile SSE grid refresh | P15-T14 |
| Shell breadcrumbs / nav polish | P16-T09 |
| Rule evaluate product panel | P17-T11 |
| Settings DB overrides + reload UX | P19-T09 |
| Integrations product UX | P19-T10 |
| Payments product UX | P19-T11 |
| SMS/push template product bar | P19-T12 |
| Stock movement types + STOCK_MOVEMENT entity | **P20-T17–T19 Done** · P20-T18 code Done (screenshots pending) |
| Entity list/record separate routes (web) | **P15-T15** Done |
| Entity list/record separate nav (mobile) | **P15-T17** Done |
| Field `read_roles` override (API + web) | **P13-T10/T11**, **P19-T03** Done |
| Branding live preview | **P19-T05** Partial |
| Document platform settings UI | **P19-T06** Partial (web + mobile read-only) |
| ABAC editor polish | **P19-T04** Partial |

---

## L. Architecture & structure memory (2026-06-14)

**Full memo:** `docs/dev/session-memos/2026-06-14-conversation-architecture-memory.md`

### Monorepo zones

| Zone | Path | Touch when |
|------|------|------------|
| Platform API | `platform/api/src/emcap/` | Generic HTTP, metadata, auth, admin |
| Business modules | `modules/*/module.py` | Entity defs, validators, domain rules |
| Web presentation | `clients/web/src/app/` | Angular UI; reuse `shared/` |
| Mobile presentation | `clients/mobile/lib/` | Flutter screens/widgets |
| Config / seed | `config/`, `data/seed/` | Flags, demo data |
| Scripts / logs | `scripts/`, `logs/emcap/` | Local stack, screenshots |

### Entity navigation model (locked)

```
Web list:     GET /app/entity/:code          → entity-list (grid only)
Web create:   GET /app/entity/:code/new      → entity-record
Web edit:     GET /app/entity/:code/:id      → entity-record + tabs

Mobile:       EntityListScreen → push EntityRecordScreen → pop
```

Grid metadata ≠ form metadata on purpose (C16 rejected).

### Admin security data flow

```
Module FieldDefinition.read_roles
  → merged with SettingOverrideRow security.field_overrides
  → GET /admin/security/policies (admin UI)
  → apply_field_security on entity record responses
```

### Screenshot scripts

`scripts/capture-screenshot-sprint.mjs` — `--only=product-workflow|entity-packs|admin-security`  
`scripts/capture-m1-screenshots.mjs` — M1 PRODUCT pack (list then record navigation)

### Session handoff

New chat: `docs/dev/HANDOFF-continue-viable-product.md`

---

## J. Scope boundaries (do not promise in viable v1)

- Runtime module hot-install
- PCI payment capture
- Layout designer **UI** (ADR at M3 only)
- In-app Grafana embed
- New modules beyond inventory + CRM reference *(W4 procurement/sales entities exist in module defs — standard profile only; W5 adds STOCK_MOVEMENT)*
- Multi-region / 99.9% SLA production proof

---

## K. Agent session checklist

1. `codebase-index.md` → this file (if product/UX) → `plan/17-viable-product-execution-playbook.md` §4 sprint order  
2. `known-pitfalls.md` before debugging  
3. Update **07** matrix for product claims; backlog **Done** ≠ Product-ready  
4. No commit unless user asks (A7)  
5. New user feedback → add row here + backlog task
ck → add row here + backlog task
