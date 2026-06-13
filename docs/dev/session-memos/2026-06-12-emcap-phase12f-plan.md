# Phase 12F plan — UI polish, i18n (Bangla), admin depth

## Goal
Close remaining Phase 12 gaps on **web + mobile**: persistence, full i18n (EN/FR/BN), payment secrets, integrations registry, row/field security viewer, mobile rail module headers.

## Plan location
`plan/12f-ui-polish-admin-depth.md` (full task IDs P12F-T01–T53, 8 PR slices, ~21.5d estimate)

## Key decisions
- Web theme/locale already use `localStorage`; mobile needs `shared_preferences` with same keys.
- i18n moves to JSON bundles; locale `bn` (Bangla, LTR); shared key manifest to prevent web/mobile drift.
- Payment secrets + integrations: extend platform admin API (not `modules/`); masked GET, audited PUT.
- Security viewer: read-only `GET /admin/security/policies`; editor stays Phase 13.

## PR slice order
1. Mobile persistence → 2. i18n infra + shell/admin → 3. entity pages + bn metadata → 4. payment secrets → 5. integrations → 6. security viewer → 7. rail headers → 8. docs/traceability

## Not committed
Planning docs only; no code changes in this step.
