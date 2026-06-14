# CRM Module — Definition of Done (product criteria)

**Task:** EMCAP-P18-T06  
**Module:** `CRM` · **Reference entities:** `LEAD` (primary), `CONTACT`  
**Gate:** `plan/16-product-ready-dod.md` · `spec/sdd/07-product-readiness-matrix.md` §17

---

## 1. What product DoD adds

| API DoD | Product DoD |
|---------|-------------|
| CRUD + pytest green | Stakeholder demo without apologizing for UX |
| Minimal seed | **10+** leads and **10+** contacts (`data/seed/demo/crm.json`) |
| Wired entity pages | Hero header, status chip, section cards, loading/error/empty |
| Matrix 04/05 Done | Matrix **07** Product-ready per surface + screenshots |

---

## 2. LEAD — product criteria

### Data & API

- [x] `status` ENUM (`new`, `qualified`, `lost`, `won`)
- [x] `status_field` on `active` for hero chip
- [x] System fields in metadata and UI

### Web UX

- [x] Nav: CRM → Leads (module-grouped sidenav)
- [x] Hero: `company — contact_name`
- [x] Screenshots: `phase18-crm-lead-grid-web.png`, `phase18-crm-lead-detail-web.png`

### Mobile UX

- [x] Parity with web hero pattern (`company — contact_name` / contact `name` + email subtitle)
- [x] Status chip from `display.status_field` (`active` → Active/Inactive)
- [x] Read-only detail fields on record view (LEAD status enum, CONTACT lead lookup visible without Edit)
- [x] Grid formatters for status enum + active boolean (`field_display_test.dart`)
- [ ] Mobile screenshot pending (Flutter SDK / P15-T13)

### Tests

- [x] `test_crm_entity_fields.py` / entity contract fixtures
- [x] Web Karma entity-system.fixture.spec (W1 CRM entities)

---

## 3. CONTACT — product criteria

- [x] `lead_id` LOOKUP → LEAD
- [x] Hero: contact `name`; email as subtitle on mobile
- [x] Screenshots: `phase18-crm-contact-grid-web.png`, `phase18-crm-contact-detail-web.png`

---

## 4. Module services

| Capability | Criterion | Evidence |
|------------|-----------|----------|
| **OPEN_LEADS** report | Reachable from CRM nav + Reports | Menu `open_leads` · `report_code=OPEN_LEADS` |
| **Permissions** | `crm.access` enforced | 403 on denied routes |
| **Standard profile** | W1 fields + fixtures | `plan/20-standard-entity-rollout.md` |

---

## 5. Sign-off checklist

- [x] Web LEAD + CONTACT Product-ready (screenshots refreshed 2026-06-14 — separate list/record routes)
- [x] Mobile Demo+ (code + unit tests; device verify open)
- [ ] M5 CRM milestone signed when mobile evidence lands

**Related:** `plan/18-reference-modules-product.md` · `modules/crm/module.py`
