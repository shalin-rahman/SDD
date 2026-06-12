# Phase 12 — Enterprise product UI & admin consoles

**Status:** In progress — 2026-06-12 (rev. 3 — shared UI + doc-sync rule)  
**Driver:** UI too minimal; matrices overstated “100%” when only API + thin shell existed.

**Gap matrix:** `spec/sdd/06-admin-product-ui-matrix.md`  
**DoD gate:** `plan/12-phase12-dod-checklist.md`  
**SDD source:** `spec/framework-sdd.txt` (all §) · `spec/sdd/01-requirements.md` (FR-008d new)

---

## Lesson: why Phase 8–11 looked “done” but was not

| Mistake | Repeat prevention |
|---------|-------------------|
| Marked **Done** when API exists but no admin/product UI | **FR-008d** + `06-admin-product-ui-matrix.md`; task cannot close without UI screenshot path + test |
| Flat nav ignored `menu.module` from API | Contract test: shell groups by `module` |
| Config read-only; no settings write | Admin settings API + UI in same PR |
| Account page treated as “user admin” | Separate `/app/admin/*` routes |
| Matrices 04/05 at 100% confused stakeholders | 04 = platform wired · 05 = CRUD depth · **06 = product/admin UX** |
| Client method without test | `REQUIRED_METHODS` in `emcap-client.test.ts` |
| Feature UI without config gate | Nav hidden when `modules.*.enabled: false` |
| Windows script failures ignored | Run `run-emcap.bat --local`; read `known-pitfalls.md` Phase 11 |
| Demo seed breaks pytest | `platform-test.yaml` demo off; seed tests |
| Docs not updated with code | Same PR: `sync-docs-after-change.md` + `emcap-doc-sync.mdc` |

**Rule:** A Phase 12 task is **Done** only when API (if new) + web UI + test + matrix row updated + manual smoke step passes.

---

## Full SDD crosswalk → Phase 12 coverage

| SDD § | Topic | Phase 8–11 reality | Phase 12 target | Task IDs |
|-------|-------|-------------------|-----------------|----------|
| §2 | Auth, menus, forms, grids, workflow, reports, notifications, documents, audit, integrations, payments | API + thin shell | Product shell consumes all; admin configures | 12A, 12C |
| §3 | Platform modes: single-org, SaaS, white-label | Partial tenant header | Tenant picker + **branding admin** | P12C-T07, P12A-T06 |
| §4 | Tenant isolation strategies | Config YAML only | **Read-only** strategy display in settings (write = Phase 13 — ops) | P12C-T17 |
| §5 | Module feature flags | YAML only | **Settings UI** + admin API | P12C-T01–T02, P12A-T03 |
| §6 | Angular + Flutter presentation | Plain HTML | **Material shell**, responsive | P12A-T01–T05, P12D |
| §7 | Identity: auth providers; RBAC/ABAC/row/field | Login, list roles, assign by ID | **Users/roles CRUD**, permission matrix, auth provider flags | P12B-* |
| §8 | Entity auto APIs/forms/grids | Done at API | Master–detail UX; entity tabs | P12A-T04, T12 |
| §9 | Dynamic forms/grids: layout, validation, conditions, i18n, export, grouping, realtime, offline | Renderers exist; layout broken | Responsive grid; grouping UI; sync indicator; app i18n | P12A-T05, T07, T13–T14 |
| §9 | Layout designer | Not started | **Phase 13** (metadata editor) | — |
| §10 | Workflow: escalation, delegation, SLA | Entity actions exist | Workflow **settings UI** + SLA labels in shell | P12C-T08 |
| §11 | Rule engine formula/scripting | API | Rule engine **toggle UI** | P12C-T09 |
| §12 | Reports, dashboards, KPIs, scheduling | Report screens | **Schedule admin UI**; dashboard nav polish | P12C-T15, P12A-T11 |
| §13 | Notification channels + templates | Channel dropdown; no templates | Channel toggles + **email/SMS template CRUD** | P12C-T03–T04, T16 |
| §14 | Documents: storage, versioning, virus scan | Upload/list in entity | Document **platform settings UI** | P12C-T12 |
| §15 | Integrations REST/GraphQL/… | Account demo buttons | **Integration registry admin UI** | P12C-T11 |
| §16 | Payment gateways | Demo when enabled | **Payment provider config UI** | P12C-T05 |
| §17 | AI optional | Chat when enabled | **AI module config UI** | P12C-T13 |
| §18 | Observability | Grafana external | Link/help in settings (not in-app Grafana) | P12C-T18 |
| §19 | Audit immutable | Record audit list | Audit **config UI** + settings change audit | P12C-T06, T14 |
| §20 | Security MFA, rate limit, headers | MFA in account | Security **settings section** (read flags) | P12C-T19, P12B-T06 |
| §26–§27 | SDK menus, permissions, localization | API returns data; UI flat | Module nav + permission-filtered menus | P12A-T02–T03, T10 |
| §30 | DoD auto capabilities | Module plug-in works | **Admin can operate** platform without YAML edits | 12B, 12C |

---

## Target UX (enterprise baseline, not full low-code)

1. **Shell:** sidenav grouped by module, toolbar (user, locale, theme, tenant), breadcrumbs  
2. **Entity:** master–detail single page; tabs for form / notes / documents / audit / workflow  
3. **Grid:** responsive, horizontal scroll, sort/filter/group/export from metadata  
4. **i18n:** locale switcher; app strings + metadata keys  
5. **Themes:** light/dark + tenant primary; persisted preference  
6. **Admin** (`/app/admin`): users, roles, permissions (FR-002)  
7. **Settings** (`/app/settings`): modules, auth, notifications, payments, grid, workflow, rules, documents, integrations, AI, audit, security (FR-005, §10–§20)  
8. **Mobile:** grouped nav, master–detail, read-only admin/settings first, then parity  

---

## Architecture

| Concern | Approach |
|---------|----------|
| Design system | Angular Material 19; Flutter Material 3 |
| **Reusable web UI** | `clients/web/src/app/shared/` — see `shared/README.md` |
| Admin APIs | `platform/api` Identity + Settings domains — **not** `modules/` |
| Config write | Validated subset; audit every change; dev reload hook |
| Secrets | Never return raw secrets in GET; mask + rotate placeholder |
| Module menus | Server filters disabled modules; client groups by `module` |
| Tests | pytest admin routes; Karma contract + component; flutter analyze |
| Parity | Every new web admin method → dart client + matrix row |

---

## Phase 12A — Shell & entity UX (web)

| ID | Task | SDD / FR |
|----|------|----------|
| P12A-T01 | Angular Material shell (sidenav, toolbar, layout breakpoints) | §6, §9 |
| P12A-T02 | Module-grouped nav from `menus[].module` | §26–§27, FR-019 |
| P12A-T03 | Filter menus: `modules.*.enabled` + user permissions | §5, FR-005 |
| P12A-T04 | Master–detail entity page (split / drawer / mobile stack) | §9, FR-008d |
| P12A-T05 | Responsive grid (scroll, min-width, sticky header) | §9 |
| P12A-T06 | Theme service: light/dark + tenant `--emcap-primary` | §3 |
| P12A-T07 | i18n: locale service + switcher + `assets/i18n/*.json` | §9, FR-007 |
| P12A-T08 | Shell component tests + update matrix 06 | NFR-013 |
| P12A-T09 | Breadcrumbs + page title from route/menu metadata | §9 |
| P12A-T10 | Permission-filtered nav from `/auth/me` permissions | §7, FR-002 |
| P12A-T11 | Platform nav gated (Workflow, Reports, AI, Payments) | §5 |
| P12A-T12 | Entity detail tabs: form, notes, documents, audit, workflow | §8, §30 |
| P12A-T13 | Grid grouping UI + export toolbar from grid metadata | §9 |
| P12A-T14 | Offline/sync status when `grid.offline` | §9 |

---

## Phase 12B — Identity admin (API + web)

| ID | Task | SDD / FR |
|----|------|----------|
| P12B-T01 | `GET/POST/PUT/PATCH /admin/users` (+ deactivate, password reset) | §7, FR-002 |
| P12B-T02 | `GET/POST/PUT /admin/roles` (+ permissions[]) | §7 |
| P12B-T03 | Admin Users UI: list + side panel create/edit | FR-008d |
| P12B-T04 | Admin Roles UI + permission multi-select | FR-008d |
| P12B-T05 | Permission matrix view (module × action) | §7 |
| P12B-T06 | Admin route guards + security audit on admin actions | §20 |
| P12B-T07 | Seed `admin.*` permissions in `data/seed/core/roles.json` | — |
| P12B-T08 | Row/field security policy viewer (read-only) | §7, FR-002 |
| P12B-T09 | Auth provider settings UI (username/oauth/ldap/sso flags) | §7, FR-001 |

---

## Phase 12C — Platform settings & templates (API + web)

| ID | Task | SDD / FR |
|----|------|----------|
| P12C-T01 | `GET/PUT /admin/settings` (validated platform.yaml subset) | §5, FR-005 |
| P12C-T02 | Settings hub UI + module toggles section | §5 |
| P12C-T03 | Notification template model + CRUD API | §13, FR-012 |
| P12C-T04 | Email template editor (subject/body, variables) | §13 |
| P12C-T05 | Payment provider config UI (masked secrets) | §16, FR-015 |
| P12C-T06 | Audit log for all settings changes | §19, FR-017 |
| P12C-T07 | Tenant branding admin (logo URL, primary, domain hint) | §3, FR-003 |
| P12C-T08 | Workflow subsystem toggles (escalation, delegation, SLA) | §10, FR-009 |
| P12C-T09 | Rule engine toggles (formula/scripting) | §11, FR-010 |
| P12C-T10 | Grid platform flags UI (export, grouping, realtime, offline) | §9 |
| P12C-T11 | Integration endpoints registry UI | §15, FR-014 |
| P12C-T12 | Document platform settings (storage, virus scan flag) | §14, FR-013 |
| P12C-T13 | AI module config UI (enabled + capability flags) | §17, FR-016 |
| P12C-T14 | Audit subsystem config UI (enabled, immutable) | §19 |
| P12C-T15 | Report schedule list/create UI | §12, FR-011 |
| P12C-T16 | SMS/push channel config + template stub | §13 |
| P12C-T17 | Tenant isolation strategy read-only display | §4, FR-004 |
| P12C-T18 | Observability links (metrics, Grafana) in settings | §18 |
| P12C-T19 | Security settings section (MFA required, rate limit flags) | §20 |

---

## Phase 12D — Mobile parity

| ID | Task |
|----|------|
| P12D-T01 | Module-grouped drawer navigation |
| P12D-T02 | Master–detail entity screen |
| P12D-T03 | Theme + locale switcher |
| P12D-T04 | Admin users/roles read-only |
| P12D-T05 | Settings read-only mirror |
| P12D-T06 | Web/mobile API client parity for admin methods |
| P12D-T07 | Material 3 shell (app bar, navigation rail/drawer) |

**Status (2026-06-12):** Done/Partial — see `06-admin-product-ui-matrix.md` rev. 5. Remaining gaps → **Phase 12F**.

---

## Phase 12F — Polish, full i18n (Bangla), admin depth

**Playbook:** `plan/12f-ui-polish-admin-depth.md`

| Workstream | Task IDs | Web + mobile |
|------------|----------|--------------|
| Preference persistence | P12F-T01–T04 | Mobile `shared_preferences`; verify web |
| Full i18n EN/FR/**BN** | P12F-T10–T16 | JSON bundles; metadata locale |
| Payment secrets (masked) | P12F-T20–T27 | Done — settings UI + admin API |
| Integrations registry | P12F-T30–T36 | Done — settings UI + admin API |
| Row/field security viewer | P12F-T40–T46 | Done — read-only admin page |
| Mobile rail module headers | P12F-T50–T53 | Done |

---

## Phase 12E — Docs, traceability, gates

| ID | Task |
|----|------|
| P12E-T01 | Split 05 matrix: “wired” vs “product UI” columns |
| P12E-T02 | Traceability rows for FR-008d + Phase 12 tasks |
| P12E-T03 | Recipe `docs/dev/recipes/enterprise-ui-shell.md` |
| P12E-T04 | Enforce `plan/12-phase12-dod-checklist.md` on every PR |
| P12E-T05 | `known-pitfalls.md` Phase 12 section |
| P12E-T06 | Update `emcap-sdd-workflow.mdc` + skills for Phase 12 |
| P12E-T07 | Add FR-008d to `01-requirements.md` |

---

## Phase 13 — Explicitly later (do not skip in matrix)

| Item | SDD § | Why later |
|------|-------|-----------|
| Visual form/grid layout designer | §9 | Large subsystem |
| Full ABAC policy builder | §7 | Needs rule DSL UI |
| Tenant isolation strategy **write** | §4 | Ops-dangerous |
| In-app Grafana dashboards | §18 | External ops tool |
| Runtime module install | §27 | Deploy model is config + `modules/` |

---

## Implementation order

```
12A (shell + entity UX)
  → 12B (identity admin)
  → 12C (settings hub — can ship in slices: modules → comms → payments)
  → 12D (mobile)
  → 12F (persistence, full i18n + Bangla, payment secrets, integrations, security viewer, rail headers)
  → 12E (gates + docs, ongoing each PR)
```

**First PR:** P12A-T01 + T02 + T04 + T10 (shell, module nav, master–detail, permission nav).

---

## Verification (every Phase 12 PR)

```bat
scripts\lint-format.bat
cd platform\api && python -m pytest -q
cd clients\web && npm run build && npm run test:ci
cd clients\mobile && flutter analyze && flutter test
scripts\run-emcap.bat --stack-only --local --skip-tests
```

**Manual smoke (minimum):**

- Module-grouped sidenav; disabled module menus hidden  
- Product entity: master–detail; edit does not duplicate row  
- Locale switch changes chrome strings  
- Admin user create → login as that user  
- Settings: toggle `notifications.enabled` → nav/UI reflects  
- Windows: run from repo root, no piped batch  

**Matrix:** update `06-admin-product-ui-matrix.md` rows touched in same PR.
