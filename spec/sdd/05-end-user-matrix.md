# EMCAP — End-User Capability Matrix (SDD §9, §7, §27)

Maps **what a business end user can do in web/mobile shells** vs what `spec/framework-sdd.txt` promises.

**Legend:** Done · Partial · No · N/A (admin/ops only)

**Last updated:** 2026-06-11 · **100% complete** (Phase 9).

**Companion:** `spec/sdd/04-capability-matrix.md`

---

## Entity & CRUD (§8, §9, §30)

| Capability | Web | Mobile | Notes |
|------------|-----|--------|-------|
| Login (username/password) | Done | Done | — |
| OAuth login (config gated) | Done | Done | — |
| Browse entity menus | Done | Done | — |
| List records | Done | Done | — |
| Create record | Done | Done | — |
| Edit record | Done | Done | — |
| Delete record | Done | Done | — |
| Search records (`?q=`) | Done | Done | — |
| Pagination | Done | Done | — |
| Record detail (notes, docs, audit) | Done | Done | — |

---

## Dynamic forms (§9)

| Capability | Web | Mobile | Notes |
|------------|-----|--------|-------|
| Metadata-driven fields | Done | Done | — |
| Field types (date, number, checkbox) | Done | Done | — |
| Inline validation errors | Done | Done | — |
| Conditional show/hide | Done | Done | — |
| Localized labels (`i18n`) | Done | Done | — |
| Layout grid (row/col/span) | Done | Done | CSS grid / flex rows |

---

## Dynamic grids (§9)

| Capability | Web | Mobile | Notes |
|------------|-----|--------|-------|
| Metadata columns | Done | Done | — |
| CSV export | Done | Done | — |
| Excel export | Done | Done | — |
| PDF export | Done | Done | — |
| Column sort | Done | Done | — |
| Column filter | Done | Done | — |
| Row grouping | Done | Done | — |
| Realtime refresh (SSE) | Done | Done | — |
| Offline sync hint | Done | Done | — |

---

## Identity & tenancy (§7, §3)

| Capability | Web | Mobile | Notes |
|------------|-----|--------|-------|
| MFA enroll/verify | Done | Done | — |
| OAuth / SSO login | Done | Done | — |
| Tenant switcher (SaaS) | Done | Done | — |
| White-label theme tokens | Done | Done | — |
| Permissions read-only | Done | Done | — |
| Role assign / ABAC check | Done | Done | Account admin section |

---

## Platform services in UI (§10–17)

| Capability | Web | Mobile | Notes |
|------------|-----|--------|-------|
| Workflow inbox actions | Done | Done | — |
| Workflow instance detail | Done | Done | Web inbox Detail button |
| Workflow escalate | Done | Done | Web inbox + API |
| Rule evaluate | Done | Done | Account |
| Start workflow from record | Done | Done | — |
| SLA / due date display | Done | Done | — |
| Reports run | Done | Done | — |
| Report history / schedules | Done | Done | — |
| Dashboards | Done | Done | — |
| Notifications (multi-channel) | Done | Done | — |
| Document upload + list | Done | Done | — |
| Document preview / versions | Done | Done | — |
| REST dispatch | Done | Done | — |
| Kafka publish | Done | Done | Account |
| SOAP invoke | Done | Done | Account |
| SFTP upload | Done | Done | Account |
| GraphQL query | Done | Done | Account |
| Payments intent + confirm | Done | Done | Flag gated |
| AI chat + summarize | Done | Done | Assistant |
| Prometheus metrics | Done | Done | Account |

---

## Business modules (§1, §27, §30)

| Module | End-user menus | Notes |
|--------|----------------|-------|
| Inventory | Done | PRODUCT, WAREHOUSE |
| CRM | Done | LEAD, CONTACT |
| Demo | Done | CUSTOMER |
| Accounting | Done | ACCOUNT, JOURNAL_ENTRY |
| HRM | Done | EMPLOYEE, LEAVE_REQUEST |
| POS | Done | SALE, TERMINAL |

---

## Quality & production (§25, §29)

| NFR | Web / Mobile | Notes |
|-----|--------------|-------|
| Renderer contract tests | Done | Karma + flutter |
| Client coverage ≥80% | Done | CI |
| Backend coverage gate 80% | Done | CI |
| Production readiness | Done | `docs/ops/production-readiness.md` |

---

## Traceability

Requirement: **FR-008c**, **FR-014** · Playbook: `plan/08-sdd-100-closure.md`
