# Product-ready definition of done (all surfaces)

Use before marking any row **Product-ready** in `spec/sdd/07-product-readiness-matrix.md` or closing a milestone in `plan/16-standard-product-system.md`.

Copy applicable sections into PR descriptions.

---

## 1. Universal gates (every Product-ready item)

- [ ] **Automated tests** pass (API pytest + client contract/build for touched layer)
- [ ] **No secrets** in GET responses or screenshots
- [ ] **Feature flags** respected (UI hidden when subsystem disabled in `config/platform.yaml`)
- [ ] **i18n** — no new user-visible hard-coded strings without EN/FR/BN keys (web + mobile when both ship)
- [ ] **Screenshot** stored at `docs/product/screenshots/<phase>-<surface>-<slug>.png` (1280×800 web; mobile device frame optional)
- [ ] **Matrix** row updated in `07-product-readiness-matrix.md` with evidence path
- [ ] **Traceability** row in `03-traceability-matrix.md` if new API or requirement slice

---

## 2. API / platform service

- [ ] OpenAPI route documented or matches existing prefix pattern
- [ ] Validation errors: 400/422 with field-level detail
- [ ] Auth: mutations require user where applicable; system fields not client-writable
- [ ] pytest: happy path + auth denial + validation failure
- [ ] Business logic remains in `modules/` unless platform contract (system fields, metadata)

---

## 3. Web UI

- [ ] Reachable from shell nav (not Account demo section)
- [ ] Responsive: 375px, 768px, 1280px
- [ ] Loading, error, empty states (no blank panels)
- [ ] Light + dark theme
- [ ] Permission guard or 403 message
- [ ] Karma/vitest for new components or renderers
- [ ] Keyboard: primary actions reachable without mouse (WCAG 2.2)

---

## 4. Mobile UI

- [ ] Same feature parity as web for the task scope
- [ ] `metadata_contract_test.dart` or widget test for metadata/renderer changes
- [ ] List → record uses **push navigation** (`EntityListScreen` → `EntityRecordScreen` → pop); not master–detail on one route
- [ ] Theme + locale persistence unchanged

---

## 5. Entity page (PRODUCT reference)

- [ ] Hero shows primary identifier (SKU — Name for PRODUCT)
- [ ] Status chip when `active` present
- [ ] System section read-only; hidden on create
- [ ] Grid: formatted datetimes; sticky header
- [ ] Save/delete/workflow in header action bar
- [ ] Screenshots: grid + detail (see `plan/14` / `plan/15`)

---

## 6. Module product sign-off

- [ ] `docs/modules/<module>-definition-of-done.md` v2 criteria met
- [ ] Seed data supports credible demo (not 1–2 rows)
- [ ] E2E smoke script or documented manual path in module README

---

## Status vocabulary

| Term | Meaning |
|------|---------|
| **Wired** | API + minimal UI |
| **Demo** | Works end-to-end; not professional |
| **Product-ready** | This checklist + tests + screenshot |

**Done** in `plan/03-task-backlog.md` means implementation complete; **Product-ready** is a separate gate in `07-product-readiness-matrix.md`.
