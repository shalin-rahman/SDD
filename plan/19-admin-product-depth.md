# Phase 19 — Admin & settings product depth

**Status:** Planned — **start after M1** (feedback C7, C8)  
**Parent:** `plan/17-viable-product-execution-playbook.md` §11  
**Supersedes:** Phase 13 as “next admin work” — resumed Phase 12 partial items  
**Prior:** `plan/13-enterprise-admin-depth.md` (ABAC slice 1 Done)

**Driver:** Admin exists but **Wired** — toggle-heavy settings, users/roles functional not enterprise IAM UX.

---

## Gate

Do **not** start P19 implementation until:

- [ ] M1 signed in `07-product-readiness-matrix.md` (PRODUCT web Product-ready)
- [ ] P16-T02 tokens landed (or explicit exception in PR)

---

## P19-T01 — Settings information architecture

**Current:** Long toggle list in settings hub.

**Target domains (left nav or tabs):**

| Domain | Contents |
|--------|----------|
| **Identity** | Auth providers, MFA defaults |
| **Security** | ABAC link, field security, rate limits read-only |
| **Platform** | Workflow, rules, grid flags, audit, observability links |
| **Modules** | Per-module enable + module-specific settings |
| **Integrations** | Registry (not Account) |
| **Notifications** | Channels + templates |
| **Payments** | Providers + secrets rotate |
| **Branding** | Tenant theme (P19-T05) |

**Mobile:** Same domains; stacked navigation.

**Maps Phase 12 partial:** P12C-T02, P12D-T05, P12C-T19.

**Screenshot:** `phase19-settings-ia-web.png`

---

## P19-T02 — Admin users/roles UX

**Target (feedback B7, B8):**

- Users table: sort, search, active badge, validation messages on save
- Roles: permission picker grouped by module (keep P12 improvement)
- Empty states on both panes
- Not reachable from Account page

**Screenshot:** `phase19-admin-users-web.png`

---

## P19-T03 — Field `read_roles` override UI

**Depends:** P13-T10 API (pending).

**Target:** Security domain → field overrides table; entity.field row; multi-select permissions; pytest contract: viewer cannot see restricted field in API + UI.

---

## P19-T04 — ABAC editor polish

ABAC CRUD exists (P13 Done). Polish:

- Validation messages inline
- Confirm on delete policy
- Test policy button → `/auth/check` preview

---

## P19-T05 — Branding live preview

**Depends:** P16-T02.

Split-pane: theme controls + live shell preview (primary color, logo URL).

Maps P12C-T07 partial.

---

## P19-T06 — Document platform settings UI

Maps **P12C-T12** pending.

Storage backend read-only display; max size; virus scan toggle; retention days.

---

## P19-T07 — Isolation write (ops only)

Maps P13-T20–T22.

Ops API with confirmation token; UI gated to `admin.ops` permission; runbook in `infra/ansible/README.md`.

---

## P19-T08 — Layout designer ADR

Maps P13-T30. **No UI** until M3 entity platform complete.

Deliverable: ADR in `spec/sdd/adrs/` — metadata edit API design, scope MVP.

---

## P19-T09 — Settings DB overrides + reload UX

**Feedback B2, H:**

- When setting stored in DB override vs YAML default, show badge “Custom”
- After save, show “Restart API or wait for reload hook” if applicable
- Module toggle: explain effective value after save

---

## P19-T10 — Integrations product UX

**Feedback B15 area, H:**

Move integration test/dispatch from Account to Settings → Integrations:

- Registry list with health status
- Test connection button with result panel
- No raw URL text fields without labels

---

## P19-T11 — Payments product UX

When `payments.enabled`:

- Provider selection cards (Stripe, etc.)
- Secrets rotate UI (exists P12F — polish into domain)
- No payment capture (out of scope §I)

---

## P19-T12 — SMS/push template product bar

Maps P12C-T16 partial.

Template list + editor with variable hints; channel enable toggles; product empty states.

---

## Verification

```bat
cd platform\api && python -m pytest tests/test_admin_api.py tests/test_auth_security.py -q
cd clients\web && npm run test:ci && npm run build
```

Manual: Settings domains navigable; Account has no integration buttons.

---

## Traceability

| FR | Tasks |
|----|-------|
| FR-002 | T02–T04, T03 |
| FR-003 | T07 |
| FR-005 | T01, T09 |
| FR-008d | T08 (ADR) |
