# Phase 26 — Business profile setup & configuration

**Status:** Wave 5 complete (2026-06-23) — P26-T12 mobile invoice print Done; P26-T13 email signature Done; P26-T15 verify Done  
**Parent:** `plan/17-standard-product-execution-playbook.md`  
**Driver:** Standard SaaS org setup — company identity, branding, contact, document headers/footers — editable in-app (feedback §B white-label, §M security/memory).

**Gap vs QuickBooks/Xero/ERP:** EMCAP had tenant primary/logo (P19-T05) but no structured org profile, legal/tax fields, fiscal calendar, or document template blocks for invoices/reports/POs.

---

## A. Business profile data model

Stored in `config/platform.yaml` → `organization_profile` block; tenant overrides via `SettingOverrideRow` (`organization_profile.*` paths).

| Field | Type | Purpose |
|-------|------|---------|
| `display_name` | string | Shown in shell, invoices, reports |
| `legal_name` | string | Contracts, tax documents |
| `tax_id` | string | VAT/GST/EIN (tenant-scoped; not secret by default) |
| `email`, `phone`, `website` | string | Contact + email signature |
| `address.*` | nested | line1, line2, city, state, postal_code, country |
| `timezone` | string | IANA e.g. `UTC`, `America/New_York` |
| `locale` | string | Default locale `en`, `fr`, `bn` |
| `currency` | string | ISO 4217 3-letter |
| `fiscal_year_start_month` | int 1–12 | GL/reporting period anchor |
| `logo_url`, `favicon_url` | string | URL ref (upload blob → Phase 26 Wave 2) |
| `secondary_color` | hex | Accent; primary stays `tenants.default.primary_color` |
| `invoice`, `report`, `purchase_order` | `{header, footer}` | Template strings with `{{token}}` interpolation |
| `email_signature` | multiline string | Notification template default block |

**Pydantic:** `OrganizationProfileSettings` in `platform/api/src/emcap/config/models.py`.

---

## B. Document templates

Metadata JSON schema (settings block, not entity metadata):

```yaml
organization_profile:
  invoice:
    header: "{{display_name}}\n{{address_line1}}"
    footer: "Thank you for your business."
  report:
    header: "{{display_name}} — Confidential"
    footer: "Generated {{date}}"
  purchase_order:
    header: "{{display_name}} — Purchase Order"
    footer: ""
  email_signature: |
    {{display_name}}
    {{email}} | {{phone}}
```

**Tokens:** `display_name`, `legal_name`, `tax_id`, `email`, `phone`, `website`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `date`.

**Client utils:** `organization-profile.util.ts`, `organization_profile_util.dart` — `interpolateOrganizationTemplate`, `resolveDocumentHeaderFooter`.

---

## C. In-app UI surfaces

| Surface | Domain | Wave |
|---------|--------|------|
| Web Settings → Identity → **Organization** | Org + contact + doc templates + **logo upload** | **W1 Done**; **W2 upload Done** (P26-T09) |
| Web Settings → Integrations → **Branding** | Primary/logo preview (P19-T05) | Exists |
| Web Settings → Platform → **Documents** | Storage/virus scan read-only | Exists |
| Mobile Settings → **Organization** expansion | Name, email, phone, logo URL preview + **upload** (injectable picker) | **W1 Done**; **W2 upload Done** (P26-T09) |
| Mobile Settings → **Branding** | Theme/domain (existing) | Partial |
| Admin vs tenant | SaaS: profile scoped to `X-Tenant-ID`; ops cannot cross-tenant | W1 API tenant bind |

**Future (W2+):** dedicated Organization tab in settings IA; logo upload panel; favicon picker; PO template editor parity on mobile.

---

## D. Security

| Control | Implementation |
|---------|----------------|
| Who can edit | `admin.settings.write` + tenant context |
| Who can read | `admin.settings.read`; public logo URL read via shell (no PII) |
| Tax ID | Not in SECRET paths; optional field-level mask in W3 |
| Logo upload | Wave 2 — reuse `documents.virus_scan_enabled`; max size from `documents.max_upload_size_mb` |
| Tenant isolation | Settings overrides bound to tenant session (`_open_session`) |
| Audit | `organization_profile.update` in `AdminAuditRow` |

---

## E. Memory / UX

| Concern | Approach |
|---------|----------|
| Logo preview | Web: `<img loading="lazy" width/height>`; Mobile: `Image.network` + `cacheWidth`/`cacheHeight` |
| Logo URL validation | `isOrganizationLogoPreviewAllowed` — http(s) only |
| Settings singleton | Shell loads platform config once; settings page reload on save |
| Mobile controllers | Org fields use dedicated controllers; disposed in `dispose()` |
| i18n | `settings.organization.*`, `settings.sections.organization` — EN/FR/BN |
| Lazy load | Org profile fetched in parallel with settings on page open |

---

## F. API design

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/organization-profile` | Merged YAML + DB overrides |
| PUT | `/api/v1/admin/organization-profile` | Partial update; Pydantic validation |
| POST | `/api/v1/admin/organization-profile/logo` | Base64 logo blob upload; virus scan; sets `logo_url` to document content URL |
| GET | `/api/v1/admin/settings` | Includes `organization_profile` in view (extended paths) |

**Validation:** email format, website http(s), currency ISO, fiscal month 1–12, secondary hex color.

**Service:** `platform/api/src/emcap/admin/organization_profile_service.py`.

---

## G. Integration points

| Consumer | Wave | Hook |
|----------|------|------|
| PDF grid export | W3 | `resolveDocumentHeaderFooter` in export pipeline |
| INVOICE print view | W3 | Invoice header/footer from org profile |
| Report renderer | W3 | Report block tokens |
| Email notifications | W4 | `email_signature` default in template merge |
| Shell title / favicon | W2 | `favicon_url` + display_name |

---

## H. Task breakdown

| ID | Task | Role | Wave | Status |
|----|------|------|------|--------|
| P26-T01 | Plan doc + FR-028 + backlog | Architect | 0 | **Done** |
| P26-T02 | Pydantic model + platform.yaml schema | Backend | 1 | **Done** |
| P26-T03 | GET/PUT organization-profile API + pytest | Backend | 1 | **Done** |
| P26-T04 | Extend ALLOWED_SETTING_PATHS + settings merge | Backend | 1 | **Done** |
| P26-T05 | Web Organization settings panel + i18n | Web | 1 | **Done** |
| P26-T06 | `organization-profile.util.ts` + karma spec | Web | 1 | **Done** |
| P26-T07 | Mobile org section + logo preview + dart tests | Mobile | 1 | **Done** |
| P26-T08 | `organization_profile_util.dart` | Mobile | 1 | **Done** |
| P26-T09 | Logo blob upload + virus scan hook | Backend + Security | 2 | **Done** |
| P26-T10 | Favicon + secondary color in branding panel | Web + Mobile | 2 | **Done** |
| P26-T11 | PDF/report export header injection | Web | 3 | **Done** |
| P26-T12 | INVOICE print view header/footer | Web + Mobile | 3 | **Done** |
| P26-T13 | Email signature merge in notification templates | Backend | 4 | **Done** |
| P26-T14 | Screenshot pack + matrix 07 Product-ready | QA | 5 | **Done** |
| P26-T15 | Full verify + doc sync | QA | 5 | **Done** |

**Wave order:** 0 plan → 1 API+UI MVP → 2 upload/branding → 3 document consumers → 4 email → 5 sign-off.

**Agent roles:** Architect (T01), Backend (T02–T04, T09, T13), Web (T05–T06, T10–T12), Mobile (T07–T08, T10, T12), Security (T09), QA (T14–T15).

---

## I. /loop verify

Sentinel: `AGENT_LOOP_WAKE_P26`

```bat
cd platform\api && python -m pytest tests/test_organization_profile_admin.py tests/test_admin_api.py -q
cd clients\web && npm run test:coverage
cd clients\mobile && dart test test/organization_profile_util_test.dart
```

CI: existing `ci.yml` branch gate ≥80% includes new karma specs.

---

## J. Doc sync checklist

- [x] `plan/03-task-backlog.md` — Phase 26 rows
- [x] `spec/sdd/03-traceability-matrix.md` — FR-028
- [x] `spec/sdd/06-admin-product-ui-matrix.md` — org profile UI row
- [x] `docs/dev/codebase-index.md` — paths + tests
- [x] `docs/dev/HANDOFF-continue-standard-product.md` — focus
- [ ] `spec/sdd/07-product-readiness-matrix.md` — after screenshot (T14)
- [ ] `clients/web/src/app/shared/README.md` — if shared component added (utils only W1)

---

## Comparison — standard SaaS org setup

| Capability | QuickBooks/Xero | EMCAP W1 | EMCAP target |
|------------|-----------------|----------|--------------|
| Company legal name | Yes | Yes | Done |
| Tax ID | Yes | Yes | Done |
| Address book | Yes | Single org address | W1 Done |
| Logo upload | Yes | **Blob upload + virus scan** (P26-T09) | Done |
| Invoice header/footer | Yes | Template strings | W1 Done; W3 render |
| Fiscal year | Yes | Month field | Done |
| Multi-currency default | Yes | currency field | Done |
| Per-user vs org profile | Separate | Org-scoped settings | Correct for B2B SaaS |
| White-label domain | Yes | tenants.default.domain | P19 exists |
