# EMCAP — End-User Capability Matrix (SDD §9, §7, §27)

Maps **what a business end user can do in web/mobile shells** vs what `spec/framework-sdd.txt` promises.

**Legend:** Done · Partial · No · N/A (admin/ops only)

**Last updated:** 2026-06-11 · Phase 8 complete (mobile parity closed).

**Companion:** `spec/sdd/04-capability-matrix.md` (platform service wiring, Phase 7).

---

## Entity & CRUD (§8, §9, §30)

| Capability | Web | Mobile | Phase 8 task |
|------------|-----|--------|--------------|
| Login (username/password) | Done | Done | — |
| OAuth login (config gated) | Done | Done | P8-T12 |
| Browse entity menus | Done | Done | — |
| List records | Done | Done | — |
| Create record | Done | Done | — |
| Edit record | Done | Done | P8-T03 |
| Delete record | Done | Done | P8-T04 |
| Search records (`?q=`) | Done | Done | P8-T05 |
| Pagination | Done | Done | P8-T05 |
| Record detail (notes, docs, audit) | Done | Done | — |

---

## Dynamic forms (§9)

| Capability | Web | Mobile | Phase 8 task |
|------------|-----|--------|--------------|
| Metadata-driven fields | Done | Done | — |
| Field types (date, number, checkbox) | Done | Done | P8-T06 |
| Inline validation errors | Done | Done | P8-T06 |
| Conditional show/hide | Done | Done | P8-T07 |
| Localized labels (`i18n`) | Done | Done | P8-T07 |
| Layout grid (row/col/span) | Partial | Partial | future |

---

## Dynamic grids (§9)

| Capability | Web | Mobile | Phase 8 task |
|------------|-----|--------|--------------|
| Metadata columns | Done | Done | — |
| CSV export | Done | Done | P8-T10 |
| Excel export | Done | Done | P8-T10 |
| PDF export | Done | Done | P8-T10 |
| Column sort | Done | Done | P8-T08 |
| Column filter | Done | Done | P8-T08 |
| Row grouping | Done | Done | P8-T09 |
| Realtime refresh (SSE) | Done | Done | — |
| Offline sync hint | Done | Done | — |

---

## Identity & tenancy (§7, §3)

| Capability | Web | Mobile | Phase 8 task |
|------------|-----|--------|--------------|
| MFA enroll/verify | Done | Done | P8-T11 |
| OAuth / SSO login | Done | Done | P8-T12 |
| Tenant switcher (SaaS) | Done | Done | P8-T13 |
| White-label theme tokens | Done | Done | P8-T13 |
| Permissions read-only | Done | Done | — |

---

## Platform services in UI (§10–17)

| Capability | Web | Mobile | Phase 8 task |
|------------|-----|--------|--------------|
| Workflow inbox actions | Done | Done | — |
| Start workflow from record | Done | Done | P8-T15 |
| SLA / due date display | Done | Done | P8-T15 |
| Reports run | Done | Done | — |
| Report history / schedules | Done | Done | P8-T16 |
| Dashboards | Done | Done | — |
| Notifications (multi-channel) | Done | Done | P8-T17 |
| Document upload + list | Done | Done | — |
| Document preview / versions | Done | Done | P8-T14 |
| Integrations dispatch UI | Done | Done | P8-T18 |
| Payments checkout (flag gated) | Done | Done | P8-T18 |
| AI chat (flag gated) | Done | Done | P8-T19 |

---

## Business modules (§1, §27, §30)

| Module | End-user menus | Phase 8 task |
|--------|----------------|--------------|
| Inventory | Done | — |
| CRM (LEAD, CONTACT) | Done | P8-T20 |
| Demo (CUSTOMER) | Done | — |

---

## Quality & production (§25, §29)

| NFR | Web / Mobile | Phase 8 task |
|-----|--------------|--------------|
| Renderer contract tests | Done | P8-T21 |
| Client coverage ≥80% | Done | P8-T21 |
| Backend coverage gate 80% | Done | P8-T21 |
| Production readiness (study tabletop) | Done | P8-T22 |

---

## Traceability

Requirement: **FR-008c** · Playbook: `plan/07-phase8-end-user-product.md` · **131/131** backlog Done
