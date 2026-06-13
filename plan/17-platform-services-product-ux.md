# Phase 17 — Platform services product UX

**Status:** Planned — presentation-only (APIs Done in `04-capability-matrix`)  
**Parent:** `plan/17-viable-product-execution-playbook.md` §9 · **Sprint:** S7–S8  
**Depends on:** P16-T05–T06 (component standardization) — can start with Material defaults if tokens lag

**Driver (feedback C5, G):** Platform APIs exist; pages are thin shells or buried on Account demo.

---

## Principles

- Reachable from **shell nav** (Workflow, Reports, Dashboards, Notifications) — not Account
- Same **loading / error / empty** pattern as entity pages (P15-T22)
- **Feature flags:** hide nav when subsystem disabled in `config/platform.yaml`
- **i18n:** EN/FR/BN for all new strings
- **Web + mobile parity** per task (or matrix N/A with reason)
- **Screenshot** per major page for P17-T10 pack

---

## P17-T01 — Workflow inbox (web)

**Current:** `workflow.component.ts` — basic HTML table, escalate button, inline transitions.

**Target UX:**

| Element | Spec |
|---------|------|
| Layout | Page header + filter row (state, assignee) + data table or card list |
| Columns | Workflow, entity, record link, state chip, assignee, due/SLA, actions |
| SLA | Badge: green (&gt;24h), amber (&lt;24h), red (overdue) from `due_at` |
| Empty | Illustration + “No workflow instances” + link to entity that can start workflow |
| Actions | Primary in row; transition confirm dialog |
| Responsive | Table → stacked cards below 768px |

**Tests:** Karma: renders empty state; loads instances mock.  
**Screenshot:** `phase17-workflow-inbox-web.png`

---

## P17-T02 — Workflow inbox (mobile)

Parity with T01; list → detail navigation; same SLA badges.  
Use shared `field_display` datetime formatters for due dates.

---

## P17-T03 — Reports history + export UX

**Current:** Report list + run; history thin.

**Target:**

- Run history table: report name, run at, status, row count, **Download CSV** button
- Running state: spinner on row
- Error state: message + retry
- Mobile: same data; CSV opens share sheet or downloads to cache

**Screenshot:** `phase17-reports-history-web.png`

---

## P17-T04 — Dashboard KPI cards

**Current:** Widget list.

**Target:**

- Grid of KPI cards (title, value, delta placeholder, icon from metadata)
- Empty: “No dashboards configured”
- Optional link to underlying report

---

## P17-T05 — Notification center

**Target:**

- List with read/unread styling; mark read on open
- Channel icon (email, push, in-app) from metadata
- Empty state
- Filter: all / unread

---

## P17-T06 — Document preview (web)

**Current:** Preview via `alert()` or minimal.

**Target:**

- Side panel or modal: PDF/image inline (`iframe` or `object`); other types → download CTA
- Version list dropdown; virus-scan status badge if API returns it
- No `alert()` for user messages

**Paths:** entity documents tab + standalone documents route if exists.

---

## P17-T07 — Document preview (mobile)

WebView or platform viewer; download to device; same version list.

---

## P17-T08 — Account → profile hub

**Current problem:** `account.component.ts` is a **developer test surface** (integrations REST/Kafka/SOAP/SFTP, GraphQL health, rule evaluate, metrics dump, payment create, role assign).

**Target — Account page only:**

| Section | Content |
|---------|---------|
| Profile | Display name, email, tenant |
| Security | MFA enroll/verify (keep); link to change password if API exists |
| Preferences | Locale + theme (move from toolbar or duplicate) |
| Roles | Read-only list (no assign-role inputs) |
| Permissions | Collapsed summary count; expand optional |

**Remove from Account (relocate):**

| Removed | New home |
|---------|----------|
| Integration dispatch buttons | P19-T10 settings Integrations |
| Rule evaluate | P17-T11 |
| Metrics fetch | Settings Observability links (P12C-T18) |
| Payment create | P19-T11 or module checkout only |
| Admin role assign | P19-T02 admin users |

**Tests:** Account component spec asserts no `dispatchRest` in template.

**Screenshot:** `phase17-account-profile-web.png`

---

## P17-T09 — Assistant polish

When `ai.enabled`: chat layout with message bubbles, input bar, empty prompt suggestions; matches shell tokens.

---

## P17-T10 — Service UX screenshot pack

Minimum set:

1. `phase17-workflow-inbox-web.png`
2. `phase17-reports-history-web.png`
3. `phase17-account-profile-web.png`
4. `phase17-notifications-web.png` (or mobile equivalent)

---

## P17-T11 — Rule evaluate product panel

**Feedback H:** Rule demo on Account → product panel.

**Target:**

- Small panel: expression input, entity context JSON optional, Evaluate button, result card
- Location: Settings → Rules domain (P19-T01) or Tools submenu
- Not on Account after P17-T08

---

## Verification

```bat
cd clients\web && npm run test:ci && npm run build
cd clients\mobile && flutter test
```

Manual smoke per `docs/dev/product-demo-runbook.md` § Platform services.
