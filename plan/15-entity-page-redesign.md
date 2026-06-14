# Phase 15 — Entity page product redesign



**Status:** In progress — Slice 15A landed 2026-06-12; **Slice 15C web routes landed 2026-06-14**; **mobile P15-T17 Done 2026-06-14**  

**Depends on:** Phase 14A-S1 (system fields visible in UI)



**Reference:** `PRODUCT` record page at professional bar; pattern generalizes to other entities.



**UX pivot (2026-06-14):** User feedback **C15** (`docs/product/user-feedback-registry.md` §F) supersedes master–detail on a single route. Slice 15C splits **list route** and **record route**. Grid columns are **not** required on the entry form (C16 rejected).



---



## Slice 15A-S1 — PRODUCT web redesign (implemented)



### Goals



- Record hero header (SKU + name, stock/price subtitle, active chip)

- Material actions (save, delete, workflow) in header — not inline form footer

- Section cards for business fields vs system fields

- Grid polish: zebra rows, sticky header, formatted datetimes



### Tasks



| ID | Task | Status |

|----|------|--------|

| EMCAP-P15-T01 | `RecordDetailHeaderComponent` (hero + chips + actions) | Done |

| EMCAP-P15-T02 | `DynamicFormView` section cards + read-only styling | Done |

| EMCAP-P15-T03 | Entity page layout integration (PRODUCT headline logic) | Done |

| EMCAP-P15-T04 | Grid visual polish + cell formatters | Done |

| EMCAP-P15-T05 | i18n keys EN/FR/BN for new entity strings | Done |

| EMCAP-P15-T06 | UX screenshots + matrix **Product-ready** gate | Done |



### UX acceptance (PRODUCT, 1280px web)



- [x] Header shows `SKU — Name` when both present

- [x] Active/inactive chip visible on existing records

- [x] Primary actions grouped in header; form has no duplicate Save at bottom

- [x] System section visually distinct (muted card)

- [x] Grid readable at 1280px without horizontal clutter on default columns

- [x] Screenshot: `docs/product/screenshots/phase15-product-detail-hero.png`

- [x] Screenshot: `docs/product/screenshots/phase15-product-grid-polish.png`



### Key paths



```

clients/web/src/app/shared/entity/record-detail-header.component.*

clients/web/src/app/shared/forms/dynamic-form-view.component.*

clients/web/src/app/shared/data/dynamic-data-grid.component.*

clients/web/src/app/pages/entity/entity-list.component.*

clients/web/src/app/pages/entity/entity-record.component.*

```



---



## Slice 15A-S2 — mobile PRODUCT (implemented)



| ID | Task | Status |

|----|------|--------|

| P15-T10 | Record detail header + section cards | Done |

| P15-T11 | PRODUCT headline/subtitle util | Done |

| P15-T12 | Grid polish + datetime cells | Done |

| P15-T13 | Mobile screenshots (M2 gate) | Partial |



**Paths:** `clients/mobile/lib/app/entity_list_screen.dart`, `entity_record_screen.dart`, `lib/utils/field_display.dart`



**Next:** Finish P15-T13 PNG capture (Flutter SDK); P15-T14 mobile SSE.



---



## Slice 15B (later)



- Entity-specific layouts from metadata (`primary_display_fields`)

- Density toggle (comfortable / compact)

- Empty-state illustration on grid zero rows



---



## Slice 15C — Separate list/record routes (2026-06-14)



**User feedback:** C15 (separate list + entry pages). **Not in scope:** forcing grid columns onto the entry form (C16 rejected).  

**Supersedes:** Phase 12 B3 master–detail-on-one-route for entity CRUD.



### Goals



1. **Split navigation** — list page and record page are distinct routes/screens, not a split-pane master–detail on one URL.

2. **Separate field sets** — list shows grid metadata columns; record shows form metadata fields (business + system sections per form contract). No `grid.keys ⊆ form.keys` product gate.

3. **Preserve 15A polish** — grid polish on list route; hero header, section cards, header actions, tabs on record route.



### Route model (web)



| Route | Purpose |

|-------|---------|

| `/app/entity/:code` | **List only** — grid, filters, New CTA, row click → navigate to record |

| `/app/entity/:code/new` | **Create** — form + header actions (form fields only) |

| `/app/entity/:code/:id` | **Edit/view** — form, tabs (Notes, Documents, Audit, Workflow) |



- No `mat-sidenav` split list+form on one route.

- Breadcrumb: module → entity label → record headline (or “New”).

- Back / cancel returns to list route (preserve grid scroll/filter state optional follow-up).



### Mobile



- `EntityListScreen` → tap row → push `EntityRecordScreen` (or named route equivalent).

- FAB or app-bar **New** → record screen with no id.

- Pop/back returns to list; no permanent split view.



### Tasks



| ID | Task | Status |

|----|------|--------|

| EMCAP-P15-T15 | Web: split list/record routes + router refactor (`entity-list` + `entity-record`) | Done — M1 + sprint scripts; PNGs refreshed 2026-06-14 |

| EMCAP-P15-T16 | ~~Grid–form field parity contract~~ | **Cancelled** — user rejected 2026-06-14 |

| EMCAP-P15-T17 | Mobile: separate list → record navigation (no master–detail split) | Done |



### UX acceptance (PRODUCT + one CRM entity, 1280px web)



- [x] List route shows grid full width; selecting row navigates to record route

- [x] Record route shows form full width; no list pane visible

- [x] New record uses `/new` route; save redirects to `/app/entity/:code/:id`

- [x] Screenshots refreshed: list-only grid + record-only detail (M1 pack + sprint workflow PNG)



### Key paths



```

clients/web/src/app/pages/entity/entity-list.component.*

clients/web/src/app/pages/entity/entity-record.component.*

clients/web/src/app/app.routes.ts

clients/mobile/lib/app/entity_list_screen.dart

clients/mobile/lib/app/entity_record_screen.dart

```


