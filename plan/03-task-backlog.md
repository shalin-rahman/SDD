# EMCAP — Task Backlog

Actionable tasks grouped by phase. IDs are stable for tracking (`EMCAP-Px-Tyy`).

## Progress summary

| Phase | Done | Pending | Partial | Total |
|-------|------|---------|---------|-------|
| 0 — Repo & local dev | 13 | 0 | 0 | 13 |
| 1 — Platform core | 26 | 0 | 0 | 26 |
| 2 — Dynamic UI & workflow | 14 | 0 | 0 | 14 |
| 3 — Platform services | 14 | 0 | 0 | 14 |
| 4 — DevOps & production | 12 | 0 | 0 | 12 |
| 5 — Reference module | 6 | 0 | 0 | 6 |
| 6 — Knowledge + client completion | 7 | 0 | 0 | 7 |
| 7 — SDD gap closure (§2 Partial/No) | 16 | 0 | 0 | 16 |
| 8 — End-user product depth (§9 UX) | 23 | 0 | 0 | 23 |
| 11 — Local dev tooling (scripts, seed, lint) | 16 | 0 | 0 | 16 |
| 12 — Enterprise product UI & admin | 71 | 0 | 0 | 71 |
| 14 — Entity platform baseline | 21 | 0 | 0 | 21 |
| 15 — Entity page redesign | 17 | 0 | 1 | 20 |
| 16 — Design system | 9 | 0 | 0 | 9 |
| 17 — Platform services UX | 11 | 0 | 0 | 11 |
| 18 — Reference modules product | 20 | 0 | 1 | 21 |
| 19 — Admin product depth | 12 | 0 | 0 | 12 |
| 20 — Quality gates | 16 | 0 | 2 | 19 |
| 21 — Infra/docs (support) | 6 | 0 | 0 | 6 |
| 22 — Agent velocity (doc integrity) | 6 | 0 | 0 | 6 |
| 23 — Security hardening | 4 | 0 | 0 | 4 |
| 24 — Residual product polish (post-M2) | 3 | 2 | 0 | 5 |
| 25 — Procurement / Sales / AP-AR / Accounting | 11 | 0 | 1 | 13 |
| 27 — i18n / l10n (BCP 47) | 12 | 0 | 0 | 12 |
| **Total** | **366** | **2** | **5** | **377** |

**Status legend:** Done · Pending · Partial (started, not complete) · Cancelled (requirement rejected — not scheduled)

**Last updated:** 2026-06-19 (9 web PNG sign-off — P24-T01/T02, P25-T13 web, P26-T14, P27-T12 web elevated in matrix 07 §10/§16/§18/§19/§20; mobile Demo+ until device PNGs)

**Current focus:** `flutter test --coverage` green (≥80%) · M2 mobile PNG pack (`scripts/capture-m2-mobile-screenshots.md`) · P25-T13 mobile PNG lane open

---

## Phase 0 — Repository & Local Dev

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P0-T01 | Define monorepo directory structure (`platform`, `modules`, `clients`, `infra`) | — | Done |
| EMCAP-P0-T02 | Scaffold FastAPI app with config loader (YAML: platform, tenant_strategy, modules) | T01 | Done |
| EMCAP-P0-T03 | Docker Compose: PostgreSQL, Redis, MinIO, API | T02 | Done |
| EMCAP-P0-T04 | Health + config introspection endpoints | T02 | Done |
| EMCAP-P0-T05 | GitFlow docs + branch protection on `main`/`develop` | T01 | Done |
| EMCAP-P0-T06 | CI pipeline: Ruff, Black, MyPy on backend | T02 | Done |
| EMCAP-P0-T07 | CI pipeline: ESLint (Angular scaffold), Flutter Analyze (scaffold) | T01 | Done |
| EMCAP-P0-T08 | Create Cursor skill `emcap-architecture` | — | Done |
| EMCAP-P0-T09 | Create Cursor skill `emcap-config` | T08 | Done |
| EMCAP-P0-T10 | Create Cursor skill `emcap-entity-sdk` | T08 | Done |
| EMCAP-P0-T11 | Create Cursor skill `emcap-devops` | T08 | Done |
| EMCAP-P0-T12 | Create rule `emcap-core-standards.mdc` (always apply) | — | Done |
| EMCAP-P0-T13 | Create rules: backend-python, frontend-angular, frontend-flutter, infra-iac | T12 | Done |

> **P0-T05:** GitFlow in `docs/dev/gitflow.md`; apply protection with `scripts/setup-branch-protection.{sh,ps1}` after push to GitHub.  
> **P0-T07:** ESLint in `clients/web/`; Flutter analyze in `clients/mobile/`; CI jobs `client-lint-web`, `client-lint-mobile`.

---

## Phase 1 — Platform Core

### 1A — Entity Framework

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P1-T01 | Design `EntityDefinition` schema (code, options: audit, workflow, notes, document) | P0 complete | Done |
| EMCAP-P1-T02 | Entity registry + validation at startup | T01 | Done |
| EMCAP-P1-T03 | Generic repository + PostgreSQL migrations per entity | T02 | Done |
| EMCAP-P1-T04 | Auto-generate REST CRUD + search endpoints | T03 | Done |
| EMCAP-P1-T05 | Audit interceptor (create/update/delete) | T04 | Done |
| EMCAP-P1-T06 | `ModuleDefinition` loader + isolated module packaging | T02 | Done |
| EMCAP-P1-T07 | Permission model from entity/module metadata | T06 | Done |
| EMCAP-P1-T08 | Dynamic menu generation from module menus | T07 | Done |
| EMCAP-P1-T09 | Unit tests: registry, repository, API (≥80%) | T04 | Done |

### 1B — Identity & Authorization

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P1-T10 | Configurable auth provider registry | P1-T04 | Done |
| EMCAP-P1-T11 | Username/password + OAuth implementation | T10 | Done |
| EMCAP-P1-T12 | RBAC roles and permissions API | T07 | Done |
| EMCAP-P1-T13 | ABAC policy engine (attribute-based rules) | T12 | Done |
| EMCAP-P1-T14 | Row-level security filter on queries | T13 | Done |
| EMCAP-P1-T15 | Field-level security on API responses | T14 | Done |
| EMCAP-P1-T16 | MFA enrollment and verification | T11 | Done |
| EMCAP-P1-T17 | Rate limiting + security headers middleware | T11 | Done |
| EMCAP-P1-T18 | Security test suite (OWASP-focused) | T17 | Done |
| EMCAP-P1-T19 | Create skill `emcap-identity-authz` | P0-T08 | Done |

### 1C — Multi-Tenancy

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P1-T20 | Tenant context middleware (resolve from subdomain/header) | P1-T11 | Done |
| EMCAP-P1-T21 | `shared_database` strategy with tenant_id column enforcement | T20 | Done |
| EMCAP-P1-T22 | `schema_per_tenant` strategy adapter | T21 | Done |
| EMCAP-P1-T23 | `database_per_tenant` strategy adapter | T21 | Done |
| EMCAP-P1-T24 | White-label: tenant domains, themes config | T20 | Done |
| EMCAP-P1-T25 | Tenant isolation integration tests | T21–T23 | Done |
| EMCAP-P1-T26 | Create skill `emcap-multi-tenancy` | P0-T09 | Done |

---

## Phase 2 — Dynamic UI & Workflow

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P2-T01 | Form metadata JSON schema (layout, validation, conditions, i18n) | Phase 1 | Done |
| EMCAP-P2-T02 | Grid metadata JSON schema (columns, export, grouping, realtime, offline) | Phase 1 | Done |
| EMCAP-P2-T03 | Backend metadata API for forms + grids per entity | T01, T02 | Done |
| EMCAP-P2-T04 | Angular dynamic form renderer | T03 | Done |
| EMCAP-P2-T05 | Angular universal grid component | T03 | Done |
| EMCAP-P2-T06 | Flutter dynamic form renderer | T03 | Done |
| EMCAP-P2-T07 | Flutter universal grid component | T03 | Done |
| EMCAP-P2-T08 | Contract test harness (metadata snapshots) | T03–T07 | Done |
| EMCAP-P2-T09 | Workflow engine core (states, transitions, assignments) | P1-T05 | Done |
| EMCAP-P2-T10 | Escalation, delegation, SLA tracking | T09 | Done |
| EMCAP-P2-T11 | Rule engine — formula evaluation mode | T09 | Done |
| EMCAP-P2-T12 | Workflow + rule engine tests | T09–T11 | Done |
| EMCAP-P2-T13 | Create skills: `emcap-dynamic-ui`, `emcap-workflow-rules` | P0-T08 | Done |
| EMCAP-P2-T14 | Create skill `emcap-testing` (coverage + contract tests) | P0-T08 | Done |

---

## Phase 3 — Platform Services

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P3-T01 | Reporting: report definitions, execution, scheduling | Phase 2 | Done |
| EMCAP-P3-T02 | Dashboards + KPI widgets | T01 | Done |
| EMCAP-P3-T03 | Notification hub + channel adapters (email, push first) | Phase 2 | Done |
| EMCAP-P3-T04 | Document storage (S3/MinIO), versioning, preview | P1-T05 | Done |
| EMCAP-P3-T05 | OCR + virus scan hooks (pluggable) | T04 | Done |
| EMCAP-P3-T06 | Integration adapters: REST, Kafka | Phase 2 | Done |
| EMCAP-P3-T07 | Payment gateway abstraction (Stripe first; regional later) | Phase 2 | Done |
| EMCAP-P3-T08 | AI platform stub behind `ai.enabled` flag | Phase 2 | Done |
| EMCAP-P3-T09 | Structured JSON logging | Phase 2 | Done |
| EMCAP-P3-T10 | Prometheus metrics + OpenTelemetry tracing | T09 | Done |
| EMCAP-P3-T11 | Grafana dashboard templates | T10 | Done |
| EMCAP-P3-T12 | Feature-flag integration tests per subsystem | T01–T08 | Done |
| EMCAP-P3-T13 | Create skills: `emcap-integrations`, `emcap-observability` | P0-T08 | Done |
| EMCAP-P3-T14 | Create skill `emcap-security` | P1-T19 | Done |

---

## Phase 4 — DevOps & Production

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P4-T01 | Terraform modules: network, K8s, PostgreSQL, Redis | Phase 3 | Done |
| EMCAP-P4-T02 | Helm charts for API, workers, ingress | T01 | Done |
| EMCAP-P4-T03 | Ansible playbooks for bootstrap/config | T01 | Done |
| EMCAP-P4-T04 | CI: integration test stage | P2-T08 | Done |
| EMCAP-P4-T05 | CI: security scan (SAST/dependency) | P1-T18 | Done |
| EMCAP-P4-T06 | CI: build + deploy dev + smoke tests | T04 | Done |
| EMCAP-P4-T07 | CI: deploy UAT + approval gate | T06 | Done |
| EMCAP-P4-T08 | CI: deploy production + rollback job | T07 | Done |
| EMCAP-P4-T09 | Database PITR + daily backup automation | T01 | Done |
| EMCAP-P4-T10 | DR runbook (RPO <15m, RTO <1h) | T09 | Done |
| EMCAP-P4-T11 | Semver release process + migration scripts | T08 | Done |
| EMCAP-P4-T12 | Create skill `emcap-release-dr` | P0-T11 | Done |

---

## Phase 5 — Reference Module

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P5-T01 | Choose reference module (Inventory recommended — entities + workflow) | Phase 4 | Done |
| EMCAP-P5-T02 | Define entities, workflows, reports, dashboards, menus only | T01 | Done |
| EMCAP-P5-T03 | Module package + independent deploy manifest | T02 | Done |
| EMCAP-P5-T04 | End-to-end tests: web + mobile + API | T03 | Done |
| EMCAP-P5-T05 | Verify zero changes to platform core | T03 | Done |
| EMCAP-P5-T06 | Definition of Done checklist sign-off | T04–T05 | Done |

---

## Phase 6 — Knowledge Base + Client Completion

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P6-T01 | Codebase index, pitfalls, recipes, recall index | Phase 5 | Done |
| EMCAP-P6-T02 | Cursor SDD workflow rule + codebase-map skill | T01 | Done |
| EMCAP-P6-T03 | LOW_STOCK / Reports UI — web | T01 | Done |
| EMCAP-P6-T04 | Reports UI — mobile | T01 | Done |
| EMCAP-P6-T05 | Client API `listReports` / `runReport` | T03, T04 | Done |
| EMCAP-P6-T06 | Full-stack smoke scripts | T03 | Done |
| EMCAP-P6-T07 | SDD doc sync (traceability, ADR, session summary) | T01–T06 | Done |

Playbook: `plan/05-phase6-playbook.md`

---

## Phase 7 — SDD Gap Closure (§2 Partial / No)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P7-T01 | Capability matrix (`spec/sdd/04-capability-matrix.md`) | Phase 6 | Done |
| EMCAP-P7-T02 | Gap closure playbook + backlog | T01 | Done |
| EMCAP-P7-T03 | Workflow transition/delegate UI (web + mobile) | T02 | Done |
| EMCAP-P7-T04 | Document upload UI (web + mobile) | T02 | Done |
| EMCAP-P7-T05 | Notifications UI (web + mobile) | T02 | Done |
| EMCAP-P7-T06 | Audit viewer UI (web + mobile) | T02 | Done |
| EMCAP-P7-T07 | Permissions viewer (web + mobile) | T02 | Done |
| EMCAP-P7-T08 | Dashboards UI (web + mobile) | T02 | Done |
| EMCAP-P7-T09 | Grid CSV export from metadata flags (web) | T02 | Done |
| EMCAP-P7-T10 | Integrations status UI (web + mobile) | T02 | Done |
| EMCAP-P7-T11 | Payments UI — feature-flag gated | T02 | Done |
| EMCAP-P7-T12 | Tenant picker + white-label theme shell | T02 | Done |
| EMCAP-P7-T13 | CI coverage gates ≥80% + contract expansion | T03–T09 | Done — API ~91%; web Karma **406** specs, **80% branches** gate (`karma.conf.js`); Flutter `check-flutter-coverage.py` 80%; recipe `add-coverage-gate.md` |
| EMCAP-P7-T14 | Mobile SSE grid refresh parity | T02 | Done |
| EMCAP-P7-T15 | Production readiness sign-off doc + Helm notes | T12 | Done |
| EMCAP-P7-T16 | Traceability + matrix + pitfalls sync | T03–T15 | Done |

Playbook: `plan/06-sdd-gap-closure.md` · Matrix: `spec/sdd/04-capability-matrix.md`

---

## Phase 8 — End-User Product Depth (§9 UX)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P8-T01 | End-user matrix (`spec/sdd/05-end-user-matrix.md`) | Phase 7 | Done |
| EMCAP-P8-T02 | Playbook + backlog | T01 | Done |
| EMCAP-P8-T03 | Record edit UI (web + mobile) | T02 | Done |
| EMCAP-P8-T04 | Record delete with confirm (web + mobile) | T02 | Done |
| EMCAP-P8-T05 | Entity search + pagination (web + mobile) | T03 | Done |
| EMCAP-P8-T06 | Form validation + field types in renderers | T04 | Done |
| EMCAP-P8-T07 | Conditional logic + i18n labels | T06 | Done |
| EMCAP-P8-T08 | Grid sort + filter | T05 | Done |
| EMCAP-P8-T09 | Grid grouping | T08 | Done |
| EMCAP-P8-T10 | Grid excel/pdf export (+ mobile CSV) | T09 | Done |
| EMCAP-P8-T11 | MFA enrollment/verify UI | T02 | Done |
| EMCAP-P8-T12 | OAuth/SSO login (config gated) | T11 | Done |
| EMCAP-P8-T13 | Tenant picker + white-label themes (full) | T12 | Done |
| EMCAP-P8-T14 | Document preview/download/versions | T02 | Done |
| EMCAP-P8-T15 | Workflow start from record + SLA display | T02 | Done |
| EMCAP-P8-T16 | Report history + schedule status UI | T15 | Done |
| EMCAP-P8-T17 | Multi-channel notifications UI | T02 | Done |
| EMCAP-P8-T18 | Integrations dispatch + payments checkout | T02 | Done |
| EMCAP-P8-T19 | AI chat UI (flag gated) | T02 | Done |
| EMCAP-P8-T20 | CRM business module scaffold | T03 | Done |
| EMCAP-P8-T21 | Renderer contract tests + coverage 80% | T06–T10 | Done |
| EMCAP-P8-T22 | Production readiness execution | T13 | Done |
| EMCAP-P8-T23 | Traceability + matrix + pitfalls sync | T03–T22 | Done |

Playbook: `plan/07-phase8-end-user-product.md` · Matrix: `spec/sdd/05-end-user-matrix.md`

---

## Phase 11 — Local dev tooling (scripts, seed, lint)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P11-T01 | JSON core/demo seed packs + `config/platform.yaml` seed section | — | Done |
| EMCAP-P11-T02 | `emcap/seed/loader.py` + API startup + `apply-seed.py` | T01 | Done |
| EMCAP-P11-T03 | `config/platform-test.yaml` (demo seed off for pytest) | T02 | Done |
| EMCAP-P11-T04 | `run-emcap.bat` / `stop-emcap` / `logs-emcap` / session log files | T02 | Done |
| EMCAP-P11-T05 | Fix batch paths: `_resolve-scripts.bat` (PowerShell `%~dp0` bug) | T04 | Done |
| EMCAP-P11-T06 | `lint-format.bat` + wire before tests in run/verify scripts | — | Done |
| EMCAP-P11-T07 | Angular ESLint + Prettier; CI `format:check` + `lint` | T06 | Done |
| EMCAP-P11-T08 | CI YAML quote `sqlite:///:memory:` | — | Done |
| EMCAP-P11-T09 | Web live logs (`run-web-with-logs.ps1`) + `pause` / errorlevel fixes | T04 | Done |
| EMCAP-P11-T10 | `test_seed_loader.py` + pytest regression for seed purge | T02–T03 | Done |
| EMCAP-P11-T11 | Docker compose mount `data/`; Dockerfile COPY data | T01 | Done |
| EMCAP-P11-T12 | Docs, pitfalls Phase 11, recipe, skills, backlog sync | T01–T11 | Done |
| EMCAP-P11-T13 | `--local` mode + `start-emcap-local.bat` (no Docker) | T04 | Done |
| EMCAP-P11-T14 | `_find-docker`, `_ensure-python-dev`, `_sleep` helpers | T04–T06 | Done |
| EMCAP-P11-T15 | `windows-local-dev.md` + skills sync | T12 | Done |
| EMCAP-P11-T16 | IDE Flake8 / PowerShell curl / pipe pitfalls documented | T15 | Done |

Playbook: `plan/11-local-dev-tooling.md` · Recipe: `docs/dev/recipes/run-emcap-local-stack.md` · **Windows:** `docs/dev/windows-local-dev.md`

---

## Phase 12 — Enterprise product UI & admin (planned)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P12A-T01 | Angular Material shell (sidenav, toolbar) | — | Done |
| EMCAP-P12A-T02 | Module-grouped navigation | T01 | Done |
| EMCAP-P12A-T03 | Filter menus by module enabled + permission | T02 | Done |
| EMCAP-P12A-T04 | Master–detail entity page (responsive) | T01 | Done |
| EMCAP-P12A-T05 | Responsive grid layout fixes | T04 | Done |
| EMCAP-P12A-T06 | Theme service (light/dark + tenant primary) | T01 | Done |
| EMCAP-P12A-T07 | i18n locale switcher + app catalogs | T01 | Done |
| EMCAP-P12A-T08 | Shell tests + matrix 06 update | T01–T07 | Done |
| EMCAP-P12A-T09 | Breadcrumbs + page title from menu metadata | T01 | Done |
| EMCAP-P12A-T10 | Permission-filtered nav from `/auth/me` | T02 | Done |
| EMCAP-P12A-T11 | Platform nav gated (workflow, reports, AI, payments) | T02 | Done |
| EMCAP-P12A-T12 | Entity tabs: form, notes, docs, audit, workflow | T04 | Done |
| EMCAP-P12A-T13 | Grid grouping UI + export toolbar | T05 | Done |
| EMCAP-P12A-T14 | Offline/sync status badge | T05 | Done |
| EMCAP-P12B-T01 | Admin users API (CRUD) | — | Done |
| EMCAP-P12B-T02 | Admin roles API (CRUD + permissions) | T01 | Done |
| EMCAP-P12B-T03 | Admin Users UI (master–detail) | T01, T03 | Done |
| EMCAP-P12B-T04 | Admin Roles + permission picker UI | T02, T03 | Done |
| EMCAP-P12B-T05 | Permission matrix view | T04 | Done |
| EMCAP-P12B-T06 | Admin route guards + audit | T03–T05 | Done |
| EMCAP-P12B-T07 | Seed admin permissions | T02 | Done |
| EMCAP-P12B-T08 | Row/field security policy viewer | T05 | Done |
| EMCAP-P12B-T09 | Auth provider settings UI | T02 | Done — Identity tab auth toggles (web + mobile); i18n EN/FR/BN; override badges; see P19-T01 |
| EMCAP-P12C-T01 | Admin settings read/write API | — | Done |
| EMCAP-P12C-T02 | Settings hub + module toggles UI | T01 | Done — mat-tab domains + module section; see P19-T01/T09 |
| EMCAP-P12C-T03 | Notification template model + API | — | Done |
| EMCAP-P12C-T04 | Email template editor UI | T03 | Done |
| EMCAP-P12C-T05 | Payment provider config UI | T02 | Done |
| EMCAP-P12C-T06 | Audit log for settings changes | T01 | Done |
| EMCAP-P12C-T07 | Tenant branding admin | T02 | Done — split-pane preview + primary/logo save when editable; product polish → P19-T05 |
| EMCAP-P12C-T08 | Workflow subsystem toggles UI | T02 | Done |
| EMCAP-P12C-T09 | Rule engine toggles UI | T02 | Done |
| EMCAP-P12C-T10 | Grid platform flags UI | T02 | Done |
| EMCAP-P12C-T11 | Integration registry UI | T02 | Done |
| EMCAP-P12C-T12 | Document platform settings UI | T02 | Done — read-only cards web + mobile; product polish → P19-T06 |
| EMCAP-P12C-T13 | AI module config UI | T02 | Done |
| EMCAP-P12C-T14 | Audit subsystem config UI | T02 | Done |
| EMCAP-P12C-T15 | Report schedule admin UI (read-only list + run) | T02 | Done |
| EMCAP-P12C-T16 | SMS/push channel + template stub | T03 | Done — channel bar + SMS/push template editor; see P19-T12 |
| EMCAP-P12C-T17 | Tenant isolation strategy read-only | T02 | Done |
| EMCAP-P12C-T18 | Observability links in settings | T02 | Done |
| EMCAP-P12C-T19 | Security settings section | T02 | Done — read-only rate limit/headers/MFA/ABAC cards; web + mobile; i18n |
| EMCAP-P12D-T01 | Mobile module-grouped nav | P12A-T02 | Done |
| EMCAP-P12D-T02 | Mobile master–detail entity | P12A-T04 | Done |
| EMCAP-P12D-T03 | Mobile theme + locale | P12A-T06–T07 | Done |
| EMCAP-P12D-T04 | Mobile admin users/roles + permission picker | P12B | Done |
| EMCAP-P12D-T05 | Mobile settings hub (toggles, templates, audit) | P12C | Done — parity with web hub: toggles, documents, security cards, template channel bar |
| EMCAP-P12D-T06 | Web/mobile admin client parity | P12B–C | Done |
| EMCAP-P12D-T07 | Flutter Material 3 shell | T01 | Done |
| EMCAP-P12F-T01 | Mobile theme/locale persistence (`shared_preferences`) | 12F-WS1 | Done |
| EMCAP-P12F-T10 | i18n JSON bundles EN/FR/BN + loader (web + mobile) | 12F-WS2 | Done |
| EMCAP-P12F-T12 | Migrate shell/admin/settings/entity strings to i18n | 12F-WS2 | Done |
| EMCAP-P12F-T13 | Migrate platform page strings (account, workflow, reports, …) | 12F-WS2 | Done |
| EMCAP-P12F-T20 | Payment secrets API (masked GET, write-only rotate) | 12F-WS3 | Done |
| EMCAP-P12F-T25 | Payment secrets settings UI (web + mobile) | 12F-WS3 | Done |
| EMCAP-P12F-T30 | Integrations registry admin API | 12F-WS4 | Done |
| EMCAP-P12F-T34 | Integrations registry settings UI (web + mobile) | 12F-WS4 | Done |
| EMCAP-P12F-T40 | Row/field security policies API (read-only) | 12F-WS5 | Done |
| EMCAP-P12F-T44 | Security policy viewer UI (web + mobile) | 12F-WS5 | Done |
| EMCAP-P12F-T50 | Mobile rail module group headers | 12F-WS6 | Done |
| EMCAP-P12E-T01 | Split 05 matrix wired vs product UI | All | Done |
| EMCAP-P12E-T02 | Traceability FR-008d rows | All | Done |
| EMCAP-P12E-T03 | Recipe + skills (enterprise UI) | T01 | Done |
| EMCAP-P12E-T04 | Enforce DoD checklist on PRs | T01 | Done |
| EMCAP-P12E-T05 | known-pitfalls Phase 12 section | T01 | Done |
| EMCAP-P12E-T06 | Update emcap-sdd-workflow rule | T01 | Done |
| EMCAP-P12E-T07 | FR-008d in requirements catalogue | — | Done |
| EMCAP-P13-T01 | ABAC policies YAML + loader | — | Done |
| EMCAP-P13-T02 | `GET/PUT /admin/security/abac` | T01 | Done |
| EMCAP-P13-T03 | Wire `/auth/check` to runtime policies | T02 | Done |
| EMCAP-P13-T04 | Web ABAC editor | T02 | Done |
| EMCAP-P13-T05 | Mobile ABAC editor | T02 | Done |
| EMCAP-P13-T06 | pytest + matrix rev. 7 | T02–T05 | Done |
| EMCAP-P13-T10 | Field `read_roles` override API | T06 | Done |
| EMCAP-P13-T11 | Merge overrides in `apply_field_security` + policies GET | T10 | Done |
| EMCAP-P13-T12 | Mobile field row edit (permission multi-select) | T11 | Done — `admin_security_screen.dart` field tap → permission picker + `PUT /admin/security/field-access`; `admin_security_field_access_test.dart` |
| EMCAP-P13-T20 | Tenant isolation write (ops) | — | Done — `PUT/GET /admin/ops/tenant-isolation` + confirmation token; `test_admin_ops_isolation.py`; ops runbook § in `infra/ansible/README.md` |
| EMCAP-P13-T21 | Settings isolation ops UI (web) | T20 | Done — settings Platform tab mode + confirmation token; `getTenantIsolationOps`/`putTenantIsolationOps` client; FR/BN i18n |
| EMCAP-P13-T30 | Layout designer ADR | — | Done — ADR-007 + API (`tenant_layout_overrides`, merge, admin CRUD) |
| EMCAP-P13-T31 | Form layout editor MVP (web) | T30 | Done — `LayoutEditorPanelComponent` form row/col/span table; settings Platform tab |
| EMCAP-P13-T32 | Grid column editor MVP (web) | T31 | Done — column reorder, sortable/filterable/width; `layout-editor-panel.component.spec.ts` |

Playbook: `plan/12-enterprise-product-ui.md` · **Phase 13:** `plan/13-enterprise-admin-depth.md` · **14:** `plan/14-entity-platform-baseline.md` · **15:** `plan/15-entity-page-redesign.md` · Product gate: `spec/sdd/07-product-readiness-matrix.md`

---

## Phase 14 — Entity platform baseline

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P14-T01 | Platform system field definitions | — | Done |
| EMCAP-P14-T02 | `created_by` column + create wiring | T01 | Done |
| EMCAP-P14-T03 | Form metadata system section (read-only) | T01 | Done |
| EMCAP-P14-T04 | Grid metadata system columns + i18n | T01 | Done |
| EMCAP-P14-T05 | Web system section + datetime display | T03–T04 | Done |
| EMCAP-P14-T06 | `test_system_fields.py` + fixture updates | T02–T04 | Done |
| EMCAP-P14-T07 | `product.grid.keys.json` fixture | T04 | Done |
| EMCAP-P14-T08 | Traceability + `07-product-readiness-matrix` | T06 | Done |
| EMCAP-P14-T10 | `updated_by` + version counter | T02 | Done |
| EMCAP-P14-T11 | Soft delete (`deleted_at`) | T10 | Done |
| EMCAP-P14-T12 | Mobile system fields parity | T05 | Done |
| EMCAP-P14-T13 | Status chip metadata contract | T01 | Done |
| EMCAP-P14-T14 | Web/mobile soft delete + restore UI | T11 | Done |
| EMCAP-P14-T20 | Enum field type in SDK | T08 | Done |
| EMCAP-P14-T21 | Lookup field type (`lookup_entity`) | T20 | Done |
| EMCAP-P14-T22 | Currency + textarea field types | T20 | Done |
| EMCAP-P14-T23 | Metadata builder validation for new types | T21–T22 | Done |
| EMCAP-P14-T24 | Web renderers (lookup, currency, textarea) | T23 | Done |
| EMCAP-P14-T25 | Mobile renderers (lookup, currency, textarea) | T23 | Done |
| EMCAP-P14-T26 | Contract fixtures per field type | T23 | Done |
| EMCAP-P14-T30 | Mobile system fields + datetime formatters | T05 | Done |
| EMCAP-P14-T31 | Mobile metadata contract tests for system fields | T30 | Done |

---

## Phase 15 — Entity page redesign

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P15-T01 | Record detail hero header component | P14-T05 | Done |
| EMCAP-P15-T02 | Section cards in dynamic form view | P14-T05 | Done |
| EMCAP-P15-T03 | PRODUCT headline/subtitle rules | T01 | Done |
| EMCAP-P15-T04 | Grid polish + cell formatters | P14-T04 | Done |
| EMCAP-P15-T05 | i18n EN/FR/BN entity strings | T01–T04 | Done |
| EMCAP-P15-T06 | UX screenshots → Product-ready gate | T01–T05 | Done |
| EMCAP-P15-T10 | Mobile record detail header + section cards | P14-T12, T01 | Done |
| EMCAP-P15-T11 | Mobile PRODUCT headline/subtitle util | T10 | Done |
| EMCAP-P15-T12 | Mobile grid polish + datetime cells | T10 | Done |
| EMCAP-P15-T13 | Mobile screenshots (M2) | T10–T12 | Partial — implementation + targeted specs green (hero 6, bulk 4/4, SSE 3/3, doc-preview 28/28, entity-record screen 6 after load fix); **M2 PNG** pending (`scripts/capture-m2-mobile-screenshots.md`) |
| EMCAP-P15-T14 | Mobile SSE grid refresh | T12 | Done — `entity_list_screen` wires `subscribeRecordsStream`; `mobile_sse_grid_test.dart` (8 contract tests: realtime/offline/grouping) |
| EMCAP-P15-T20 | Hero rules via metadata `display` hints | P14-T13, P16-T02 | Done |
| EMCAP-P15-T21 | Redesign WAREHOUSE + CRM entities | T20 | **Cancelled** — superseded by generic `entity-list`/`entity-record` + P18-T03/T06 screenshots 2026-06-14; no entity-specific page code required |
| EMCAP-P15-T22 | Loading skeletons + error retry | T21 | Done — web entity initial load + list reload `[loading]` on grid; mobile `entity_list_screen` loading panel + inline list reload + error retry |
| EMCAP-P15-T23 | Empty grid state + New CTA | T22 | Done — web `DynamicDataGridComponent` empty-state + `entity.new` action; mobile `entity_list_screen` empty grid + `entity.new` CTA |
| EMCAP-P15-T15 | Web: separate list/record routes (no master–detail split) | T06, T23 | Done — `entity-list` + `entity-record`; M1 PNGs refreshed 2026-06-14 |
| EMCAP-P15-T16 | ~~Grid–form field parity contract~~ | P14-T26 | **Cancelled** — user rejected 2026-06-14; grid and form are separate surfaces |
| EMCAP-P15-T17 | Mobile: separate list → record navigation | T10–T12 | Done — `entity_list_screen` + `entity_record_screen`; push nav; form fields from metadata only |
| EMCAP-P15-T30 | Keyboard nav grid (WCAG) | T21 | Done — `DynamicDataGridComponent` row focus, ArrowUp/Down, Enter opens record; `dynamic-data-grid.component.spec.ts` |
| EMCAP-P15-T31 | Screen reader labels on forms | T30 | Done — `aria-label` on dynamic form inputs/select/textarea/checkbox via `dynamic-form-view` |
| EMCAP-P15-T32 | axe-core a11y CI (web) | T30–T31 | Done — `axe-core` + `*.a11y.spec.ts` (entity-list, settings); `npm run test:a11y`; Karma 202/202 |

Playbook: `plan/15-entity-page-redesign.md` · `plan/17-standard-product-execution-playbook.md` §7

---

## Phase 16 — Design system

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P16-T01 | ADR design tokens | — | Done |
| EMCAP-P16-T02 | Web CSS variables + theme | T01 | Done |
| EMCAP-P16-T03 | Flutter ThemeExtension tokens | T01 | Done — `lib/theme/app_tokens.dart` + `theme_tokens_test.dart`; wired via `EmcapTheme.buildThemeData` |
| EMCAP-P16-T04 | `docs/product/design-system.md` catalog | T02–T03 | Done |
| EMCAP-P16-T05 | Web component standardization | T02 | Done — `.emcap-badge` on admin/settings/record header; settings template vars use clickable badge buttons (no `mat-chip`); `--emcap-*` tokens in settings SCSS |
| EMCAP-P16-T06 | Mobile component standardization | T03 | Done — settings `EmcapThemeTokens` padding + `EmcapBadge`; grid `DataTableTheme` density; shell density toggle |
| EMCAP-P16-T07 | Density comfortable/compact | T05–T06 | Done — `ThemeService` + `data-density` tokens; Account toggle; EN/FR/BN |
| EMCAP-P16-T08 | Dark mode contrast audit | T02–T03 | Done — audit table in `design-system.md`; dark token + badge fixes |
| EMCAP-P16-T09 | Shell breadcrumbs + nav polish | T05 | Done — breadcrumbs on entity/admin/settings; i18n page titles + sidenav load retry/empty (M6) |

Playbook: `plan/16-standard-product-system.md` § W3 · ADR-006

---

## Phase 17 — Platform services product UX

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P17-T01 | Workflow inbox UX | P16-T05 | Done |
| EMCAP-P17-T02 | Workflow inbox mobile | P16-T06 | Done |
| EMCAP-P17-T03 | Reports history + export UX | P16 | Done |
| EMCAP-P17-T04 | Dashboard KPI cards | P16 | Done |
| EMCAP-P17-T05 | Notification center | P16 | Done |
| EMCAP-P17-T06 | Document preview web | P16 | Done |
| EMCAP-P17-T07 | Document preview mobile | T06 | Done |
| EMCAP-P17-T08 | Account → profile hub | P16 | Done |
| EMCAP-P17-T09 | Assistant polish | P16 | Done |
| EMCAP-P17-T10 | Service UX screenshots | T01–T09 | Done — `scripts/capture-screenshot-sprint.mjs`; P17 pack + LOW_STOCK report 2026-06-14 |
| EMCAP-P17-T11 | Rule evaluate product panel | P17-T08 | Done |

Playbook: `plan/17-platform-services-product-ux.md`

---

## Phase 18 — Reference modules product

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P18-T01 | Inventory DoD v2 (product) | M1 | Done |
| EMCAP-P18-T02 | Realistic PRODUCT seed | — | Done |
| EMCAP-P18-T03 | WAREHOUSE Product-ready | P15-T21 | Done — `phase18-warehouse-grid-web.png`, `phase18-warehouse-detail-web.png` |
| EMCAP-P18-T04 | Workflow on PRODUCT detail | P17-T01 | Done |
| EMCAP-P18-T05 | Module report UX | P17-T03 | Done — report menus in module nav + `test_module_report_menus.py` |

> **P18-T05:** Reports UX + `phase18-inventory-low-stock-report.png` + `phase18-inventory-low-stock-via-nav-web.png` Done 2026-06-14 (module report menus + sidenav reachability).
| EMCAP-P18-T06 | CRM LEAD/CONTACT product | P15-T21 | Done — web Product-ready + screenshots; mobile `crm_entity_contract_test.dart` (13) + `crm_record_screen_test.dart` (2) after entity-record load fix; device PNG for matrix Product-ready still open |
| EMCAP-P18-T07 | Menu icons in metadata | P16 | Done — `MenuDefinition.icon` + GET `/menus` + `SidenavNavComponent` mat-icon; all modules; `test_module_report_menus.py` + `sidenav-nav.component.spec.ts` |
| EMCAP-P18-T08 | Inventory product smoke | T03–T05 | Done — `test_inventory_product_smoke.py` WAREHOUSE + STOCK_MOVEMENT draft chain |

Playbook: `plan/18-reference-modules-product.md`

### Phase 18B — Standard professional app gap (planning)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P18-PLAN | Standard professional app gap analysis | — | Done — `plan/18-standard-professional-app-gap-plan.md` |
| EMCAP-P18-T11 | Enterprise auth UX (OAuth cards, MFA steps, session expiry) | P19-T02 | Done — web provider picker + MFA steps + `phase18-login-web.png`, `phase18-account-auth-web.png`; mobile provider chips + session expiry |
| EMCAP-P18-T13 | Grid bulk actions (select, export, soft-delete) | P14 entity platform | Done — web+e2e+API; mobile `bulk_grid_util.dart` + `entity_list_bulk_test.dart` (10) + `entity_list_screen_bulk_test.dart` (4/4 green 2026-06-19) |
| EMCAP-P18-T12 | App i18n depth (entity, admin, settings bodies) | P16 shell i18n | Done — lookup picker/field, tenant select, mobile admin bodies; `scripts/audit-i18n.mjs` + `admin_i18n_strings_test.dart` |
| EMCAP-P18-T14 | Playwright E2E smoke + CI hook | Local stack recipe | Done — `e2e-smoke-optional` in `ci.yml` (non-blocking PR); weekly `e2e-smoke.yml` authoritative |
| EMCAP-P18-T15 | M6 admin/settings Product-ready screenshot batch | P19-T01–T12 | Done — `node scripts/capture-screenshot-sprint.mjs --only=admin-settings` (8 PNGs); matrix 07 §12; README § P18-T15 (2026-06-17) |
| EMCAP-P18-T21 | Admin users/roles/security Product-ready elevation | P18-T15 | Done — `plan/16-product-ready-dod.md` §3 applied (load retry, saveError, deactivate confirm, ABAC empty/retry); Karma specs; matrix 07 §12 + 06 §7 (2026-06-17) |
| EMCAP-P18-T09 | M2 PRODUCT mobile Product-ready sign-off | P15-T13, P20-T03 | Partial — code + widget specs green; **full `flutter test --coverage`** + M2 PNG required before matrix §9 mobile Product-ready |
| EMCAP-P18-T10 | CRM mobile LEAD/CONTACT Product-ready | P18-T06, P18-T09 | Done — `crm_record_screen_test.dart` (2) + contracts (13); matrix §18 mobile Product-ready blocked on M2 PNG only |
| EMCAP-P18-T16 | Mobile entity platform Product-ready (lookup, status, soft delete) | P18-T09 | Done — `entity_platform_mobile_test.dart` (11) + `lookup_field_test.dart` (3) + `entity_record_screen_lifecycle_test.dart` (2); matrix Product-ready blocked on M2 PNG |
| EMCAP-P18-T17 | STOCK_MOVEMENT mobile Product-ready | P20-T18, P18-T09 | Done — `entity_record_movement_test.dart` (9) + `entity_record_screen_movement_test.dart` (2); matrix Product-ready blocked on M2 PNG |
| EMCAP-P18-T18 | Document preview mobile Product-ready | P17-T06 | Done — util (24) + dialog (4/4); matrix §10 mobile Product-ready blocked on device PNG |
| EMCAP-P18-T20 | Grid realtime/offline mobile parity | P15-T14 | Done — contract (8) + `entity_list_screen_sse_test.dart` (3/3); matrix Product-ready blocked on M2 PNG |
| EMCAP-P18-T19 | Assistant + rule-evaluate product bar | P17-T09, P17-T11 | Done — web flag gate, empty/retry/i18n; rule-evaluate formula gate + specs (2026-06-17) |
| EMCAP-P18-T22 | Remaining YAML-only settings (AI backend, observability) | P19-T01 | Done — web read-only AI backend summary + observability runbook hints; `ai.enabled` toggle editable (2026-06-17) |

---

## Phase 19 — Admin product depth (resumed Phase 13)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P19-T01 | Settings IA by domain | M1 | Done — mat-tab domains (Modules, Identity, Platform, Integrations); FR/BN `settings.domains.*` stubs; tab spacing |
| EMCAP-P19-T02 | Admin users/roles UX | P16 | Done — users search, active chips, empty state; roles search + empty + module permission chips, save validation, i18n; `admin-users.component.spec.ts` + `admin-roles.component.spec.ts` smoke |
| EMCAP-P19-T03 | Field `read_roles` override UI | P19-T02 | Done — web field matrix + picker; API P13-T10; screenshot `phase19-admin-security-field-access-web.png` |
| EMCAP-P19-T04 | ABAC editor polish | P19-T03 | Done — delete confirm + inline validation + checkAuth test preview; deny-path pytest P23-T04 |
| EMCAP-P19-T05 | Branding live preview | P16-T02 | Done — split-pane preview, tenant primary save + `ThemeService.applyTenantPrimary`, WCAG contrast hint, i18n EN/FR/BN; screenshot `phase19-settings-branding-web.png` |
| EMCAP-P19-T06 | Document settings UI | P19-T01 | Done — read-only Platform tab + mobile Documents section with badge chips; `document-platform-settings.util` web + mobile tests; screenshot `phase19-settings-documents-web.png` |
| EMCAP-P19-T07 | Isolation write (ops) | P19-T01 | Done — `docs/dev/recipes/tenant-isolation-write-test.md`; `test_auth_security.py` + `test_postgres_integration.py` paths documented |
| EMCAP-P19-T08 | Layout designer ADR | M3 | Done — ADR-007; no UI until M3 entity platform Product-ready |
| EMCAP-P19-T09 | Settings DB overrides + reload UX | P19-T01 | Done — Custom badge on override paths; reload hint + module effective summary after save; `settings.component.spec.ts` |
| EMCAP-P19-T10 | Integrations product UX | P19-T01 | Done — Settings registry cards + labeled fields + test REST; Account has no integration buttons |
| EMCAP-P19-T11 | Payments product UX | P19-T01 | Done — provider cards + secret rotate when module+payments enabled |
| EMCAP-P19-T12 | SMS/push template product bar | P19-T01 | Done — channel bar + template editor with variable chips + empty state |

Playbook: `plan/19-admin-product-depth.md` · `plan/13-enterprise-admin-depth.md`

---

## Phase 20 — Quality gates

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P20-T01 | Screenshot convention | — | Done |
| EMCAP-P20-T02 | M1 PRODUCT web screenshots | P15-T06 | Done |
| EMCAP-P20-T03 | M2 PRODUCT mobile screenshots | P15-T13 | Partial — runbook + M2 widget/contract specs green; **PNG capture** pending |
| EMCAP-P20-T04 | Client REQUIRED_METHODS sync | — | Done — web `emcap-client.spec.ts` + mobile `emcap_client_contract_test.dart`; `getReportRun` parity 2026-06-15 |
| EMCAP-P20-T05 | Metadata snapshot CI all entities | P14-T26 | Done |
| EMCAP-P20-T06 | Web bundle / lazy routes plan | P16 | Done — entity list/record, notifications, account lazy-loaded; initial 818 kB (under 900 kB warning) |
| EMCAP-P20-T07 | Entity list perf budget | P15-T22 | Done — lazy entity routes; `app.routes.spec.ts` smoke |
| EMCAP-P20-T08 | Matrix rev per milestone | M1–M6 | Partial — M2 targeted specs green; **full `flutter test --coverage`** + M2 PNG before M2 **Product-ready** sign-off |
| EMCAP-P20-T09 | W1 standard module fields (WAREHOUSE, CRM) | P20-T05 | Done |
| EMCAP-P20-T10 | W1 web fixtures + headline generalize | P20-T09 | Done |
| EMCAP-P20-T11 | W1 mobile contracts + If-Match PUT | P20-T09 | Done |
| EMCAP-P20-T12 | W2 module fields (JE, SALE, LEAVE) | W1 | Done |
| EMCAP-P20-T13 | W2 web/mobile fixture parity | P20-T12 | Done — JE/SALE/LEAVE fixtures; Karma 130/130; mobile contracts + headlines; local `flutter test` available |
| EMCAP-P20-T14 | W3 remaining entities status + fixtures | W2 | Done — ACCOUNT balance CURRENCY + status; TERMINAL/EMPLOYEE status; EMPLOYEE department ENUM; fixtures API+web+mobile; Karma 145/145; pytest 94 (w2+w3+contract); local `flutter test` available |
| EMCAP-P20-T15 | W4 procurement/sales standard profile (API) | W3 | Done |
| EMCAP-P20-T16 | W4 web/mobile fixture parity | P20-T15 | Done — web Karma 115/115; mobile fixture loader W4; local `flutter test` available |
| EMCAP-P20-T17 | W5 STOCK_MOVEMENT + LINE + movement_type enum | M4 / P18-T03 | Done |
| EMCAP-P20-T18 | W5 stock movement product UX + screenshots | P20-T17 | Done — web+mobile code; Karma 115/115; screenshot pack + local Flutter verify pending |
| EMCAP-P20-T19 | W5 posted movement → qty_on_hand (`apply_posted_movement` in module) + seed + report | P20-T17 | Done |
| EMCAP-P20-T20 | W5 draft→posted UX on record route (status transition + user feedback) | P20-T19 | Done |
| EMCAP-P20-T21 | W5 STOCK_MOVEMENT_LINE child browse on movement record tab | P20-T18 | Done |

Playbook: `plan/20-standard-entity-rollout.md` (API · Web · Mobile · Tests — W1–W5)

---

## Phase 21 — Infra/docs support

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P21-T01 | PG migrations system columns | P14-T12 | Done — `migrations/002_system_columns.sql`; `docs/dev/recipes/apply-pg-migrations.md`; `test_migrations.py` |
| EMCAP-P21-T02 | Product demo runbook | P18-T02 | Done |
| EMCAP-P21-T03 | PG migration CI integration | P21-T01 | Done — CI integration job runs `migrate.py up`; `test_postgres_integration.py::test_system_columns_present_after_migrations` |
| EMCAP-P21-T04 | Sync `plan/20` §2–3 paths (`entity-list`/`entity-record`, `entity_list_screen`/`entity_record_screen`) | P15-T15 | Done |
| EMCAP-P21-T05 | Refresh `plan/17` §1 current-state snapshot (P17 Done, M1/M4 signed) | P17-T10 | Done |
| EMCAP-P21-T06 | Mobile admin `updateAdminFieldAccess` client parity | P19-T03 | Done |

---

## Phase 22 — Agent velocity (doc integrity)

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P22-T01 | Replace stale `entity.component.*` refs in skills, recipes, `.cursor/rules/frontend-angular.mdc`, `03-traceability-matrix.md` | P15-T15 | Done |
| EMCAP-P22-T02 | Update `enterprise-ui-shell.md` — entity separate routes; admin-only master–detail | P22-T01 | Done |
| EMCAP-P22-T03 | `16-product-ready-dod.md` §4 mobile — push nav not master–detail | P15-T17 | Done |
| EMCAP-P22-T04 | `user-feedback-registry.md` §M security + memory standing orders | — | Done |
| EMCAP-P22-T05 | `HANDOFF` tiered read order (memory tiers 1–3) + memo trust rules | P22-T04 | Done |
| EMCAP-P22-T06 | Sync `emcap-identity-authz` + `emcap-security` skills (admin CRUD, field overrides done) | P19-T03 | Done |

---

## Phase 23 — Security hardening

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P23-T01 | Filter form/grid metadata by `read_roles` + field overrides (not record GET only) | P13-T11 | Done |
| EMCAP-P23-T02 | Web entity form: hide fields absent from secured record payload (defense in depth) | P23-T01 | Done |
| EMCAP-P23-T03 | `.gitignore` `*.db` / `emcap*.db`; remove tracked DB from index | — | Done — `git rm --cached` applied; see `known-pitfalls.md` |
| EMCAP-P23-T04 | ABAC test-policy preview + deny-path pytest (P19-T04 completion) | P19-T04 | Done — `evaluate_abac` resource-context fix; `test_admin_abac_check_auth_deny_path` |

---

## Phase 24 — Residual product polish (post-M2)

> **Plan:** `plan/21-standard-product-residual-gaps.md` — web P24-T01/T02/T05 **Done** 2026-06-19; PNG pack refreshed via `capture-phase24-screenshots.mjs`; mobile P24-T03/T04 pending.

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P24-T01 | Document preview web Product-ready elevation | P17-T06 | Done — `docs/product/screenshots/phase24-document-preview-web.png` via `capture-phase24-screenshots.mjs` (2026-06-19); matrix §10 **Product-ready (web)** |
| EMCAP-P24-T02 | STOCK_MOVEMENT_LINE inline child grid UX polish | P20-T21 | Done — `docs/product/screenshots/phase24-stock-movement-lines-web.png` via `capture-phase24-screenshots.mjs` (2026-06-19); matrix §16 LINE row **Product-ready (web)** |
| EMCAP-P24-T03 | Mobile admin Product-ready sign-off | P18-T09, P18-T21 | Pending — admin PNG pack; matrix §12 mobile (**Flutter**) |
| EMCAP-P24-T04 | Mobile a11y semantics (TalkBack/VoiceOver) | P18-T09 | Pending — Semantics on entity primary flows + manual checklist (**Flutter**) |
| EMCAP-P24-T05 | Web page spec depth ratchet | P20-T04 | Done — entity-record + movement-line util + document-preview specs + `child-lines-section.component.spec.ts`; **492/492** Karma; branches **80.15%** |

---

## Phase 25 — Procurement / Sales / AP-AR / Accounting

> **Plan:** `plan/25-procurement-sales-ap-ar-accounting.md` — W1–W4 + seed (P25-T01–T12) **Done** 2026-06-19; **P25-T13** web Product-ready **Done**; mobile PNG lane **Partial**.

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P25-T01 | Plan doc + FR-025/026/027 + backlog rows | — | Done |
| EMCAP-P25-T02 | PURCHASE_ORDER_LINE + SALES_ORDER_LINE entities + fixtures + pytest | P25-T01 | Done |
| EMCAP-P25-T03 | PO receive validator + STOCK_MOVEMENT spawn + tests | P25-T02 | Done |
| EMCAP-P25-T04 | VENDOR_PAYMENT + CUSTOMER_PAYMENT + multi-pay validators | P25-T02 | Done |
| EMCAP-P25-T05 | JOURNAL_ENTRY_LINE + double-entry post + balance rollup | P25-T02 | Done |
| EMCAP-P25-T06 | Finance permissions + field read_roles + security tests | P25-T04, P25-T05 | Done |
| EMCAP-P25-T07 | Web child-lines-section + PO/SO inline grids + i18n | P25-T03, P25-T06 | Done |
| EMCAP-P25-T08 | Web payment UI + balance cards + karma ≥80% branches | P25-T04, P25-T06 | Done |
| EMCAP-P25-T09 | Mobile PO/SO/payment utils + screen wiring + dart tests | P25-T03, P25-T04 | Done |
| EMCAP-P25-T10 | Mobile add-line navigation parity + widget tests | P25-T09 | Done |
| EMCAP-P25-T11 | Demo seed JSON + seed loader tests | P25-T03–T05 | Done — `procurement.json`, `sales.json`, extended `accounting.json`; `test_seed_loader.py` procurement/sales/GL smoke (9 passed) |
| EMCAP-P25-T12 | Full verify + doc sync all matrices | P25-T07–T11 | Done — matrices 04/05/07, backlog, HANDOFF; seed pytest + Karma 527/527 |
| EMCAP-P25-T13 | Screenshot pack + matrix 07 Product-ready | P25-T12 | Partial — web **Done**: 5 PNGs (`docs/product/screenshots/phase25-*-web.png`) via `capture-signoff-screenshots.mjs --only=p25` (2026-06-19); matrix §18 web rows elevated; **mobile device PNG open** |

---

## Phase 26 — Business profile setup & configuration

> **Plan:** `plan/26-business-profile-configuration.md` — Wave 1 (P26-T01–T08) **Done** 2026-06-18; Wave 2 P26-T09 **Done** 2026-06-19.

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P26-T01 | Plan doc + FR-028 + backlog rows | — | Done |
| EMCAP-P26-T02 | Pydantic `organization_profile` + platform.yaml defaults | P26-T01 | Done |
| EMCAP-P26-T03 | GET/PUT `/admin/organization-profile` + pytest | P26-T02 | Done |
| EMCAP-P26-T04 | Extend admin settings paths + merge | P26-T02 | Done |
| EMCAP-P26-T05 | Web Organization settings panel + EN/FR/BN i18n | P26-T03 | Done — org.* starter-catalog keys wired EN/FR/BN (fr-FR added 2026-06-19) |
| EMCAP-P26-T06 | `organization-profile.util.ts` + karma spec | P26-T05 | Done |
| EMCAP-P26-T07 | Mobile org section + logo URL preview + dart tests | P26-T03 | Done — org.* keys EN/FR/BN + invoice/report templates; `test/settings_screen_organization_test.dart` (5 cases); `file_picker` wired in `shell.dart` |
| EMCAP-P26-T08 | `organization_profile_util.dart` | P26-T07 | Done |
| EMCAP-P26-T09 | Logo blob upload + virus scan hook | P26-T03 | Done — POST `/admin/organization-profile/logo`; `DocumentService` + EICAR hook; web file picker + mobile injectable picker; pytest + dart tests |
| EMCAP-P26-T10 | Favicon + secondary color branding parity | P26-T09 | Pending |
| EMCAP-P26-T11 | PDF/report export header injection | P26-T06 | Pending |
| EMCAP-P26-T12 | INVOICE print view header/footer | P26-T11 | Pending |
| EMCAP-P26-T13 | Email signature merge in notifications | P26-T03 | Pending |
| EMCAP-P26-T14 | Screenshot pack + matrix 07 Product-ready | P26-T05, P26-T07 | Done — `phase26-organization-profile-web.png` via `capture-signoff-screenshots.mjs --only=p26` (2026-06-19); matrix §19 |
| EMCAP-P26-T15 | Full verify + doc sync (`AGENT_LOOP_WAKE_P26`) | P26-T09–T14 | Pending |

---

## Phase 27 — i18n / l10n localization (BCP 47)

> **Plan:** `plan/26-i18n-l10n-localization.md` · **Gap audit:** `docs/dev/session-memos/2026-06-18-i18n-gap-audit.md` · **Seed:** `data/i18n/seed/starter-catalog.json` · **Proposed FR:** FR-029

| ID | Task | Depends | Status |
|----|------|---------|--------|
| EMCAP-P27-T01 | Plan + gap audit + FR-029 trace note + backlog | — | Done |
| EMCAP-P27-T02 | BCP 47 migration; rename bundles; update `spec/i18n/emcap-ui-keys.json` | P27-T01 | Done |
| EMCAP-P27-T03 | Web `I18nService` lazy chunks + `t`/`plural` + BCP 47 persistence | P27-T02 | Done (W1 — flat bundles, alias shims, starter-catalog merge) |
| EMCAP-P27-T04 | Web `locale-format.util.ts` + karma spec (numerals, currency, date) | P27-T02 | Done (W1 — branch coverage ≥80%) |
| EMCAP-P27-T05 | Mobile `I18nService` + `locale_format_util.dart` + dart tests (no flutter run) | P27-T02 | Done |
| EMCAP-P27-T06 | Merge seed catalog; fix BN gaps; web/mobile key parity | P27-T03–T05 | Done |
| EMCAP-P27-T07 | Wire `a11y.*`, `ux.*`, `security.*`, `deployment.*` catalog to UI | P27-T06 | Done |
| EMCAP-P27-T08 | P25 finance + P26 org i18n completion (web) | P27-T07 | Done |
| EMCAP-P27-T09 | Mobile parity: org BN, finance, a11y semantics | P27-T07 | Done |
| EMCAP-P27-T10 | CI parity script; i18n tests green; web branch coverage ≥80% | P27-T08–T09 | Done |
| EMCAP-P27-T11 | Matrix 06/07 + traceability FR-029 + pitfall + codebase-index sync | P27-T10 | Done |
| EMCAP-P27-T12 | Full verify + locale-switch screenshot spot-check (`AGENT_LOOP_WAKE_P27`) | P27-T11 | Done (web) — `docs/product/screenshots/phase27-locale-switch-bn-bd-web.png` via `capture-signoff-screenshots.mjs --only=p27` (2026-06-19); matrix 07 §20 + matrix 06 i18n row; mobile device PNG open |

---

## Crash course — zero-exploration sprints

**Read order (never skip):** `codebase-index.md` → `user-feedback-registry.md` §A/F → this section → task card paths only.

| Sprint | Goal | Tasks | Verify (copy-paste) | Blocker |
|--------|------|-------|---------------------|---------|
| **CC-0** | Doc + memory integrity | P22-T01–T06, P21-T04–T05 | Grep `entity.component` → 0 outside memos | — |
| **CC-1** | M2 mobile sign-off | P15-T13, P20-T03 | `cd clients/mobile && flutter pub get && flutter test --coverage`; `scripts/capture-m2-mobile-screenshots.md` | PNG evidence — do not mark Product-ready without PNGs (`flutter` on PATH; install outside Downloads — `known-pitfalls.md` § Flutter PATH) |
| **CC-2** | CRM mobile Product-ready | P18-T06 | `flutter test test/entity_system_contract_test.dart` | PNG evidence |
| **CC-3** | W5 post UX | P20-T20, P20-T21 | pytest `test_stock_movement_entities.py`; Karma entity specs | — |
| **CC-4** | Admin depth | P19-T04, T09–T12, P21-T06, P23-T04 | Karma admin specs; `test_admin_api.py` | — |
| **CC-5** | Security metadata filter | P23-T01–T02 | `test_admin_field_access_override.py` + new metadata deny test | — |
| **CC-6** | Repo hygiene | P23-T03 | `git check-ignore emcap-local.db`; DB not in `git status` | — |
| **CC-7** | Design + a11y | P16-T05, T09, P15-T30–T32 | `npm run test:ci`; axe CI job | — |
| **CC-8** | Infra hardening | P21-T01, P20-T06–T07, P20-T04 | pytest; `ng build --stats-json`; `npm run test:coverage` | — |

**Parallel lanes after CC-0:** CC-1 + CC-2 (mobile verify + PNG) alongside CC-3 + CC-4 + CC-5 (web-only).

---

## Immediate Next Steps

See **critical path** in `plan/16-standard-product-system.md` §3–§4.

1. ~~**S1 / M1:** P15-T06 + P20-T02 (PRODUCT web screenshots)~~ **Done** 2026-06-13
2. **S2 / M2:** P15-T13 + P20-T03 — **Partial** (hero widget tests + integration_test; PNG capture pending — run `scripts/capture-m2-mobile-screenshots.md`)
3. **S3:** P16-T02–T03 — **Done** (web + Flutter `EmcapThemeTokens`)
4. **S7 web:** P17-T04+ dashboards, docs (P17-T01, T03 Done)
5. **S4–S6:** P14 lookup/status, P15 depth, a11y
6. **S9–S10:** P18 reference modules
7. **S11–S13:** P19 admin (M1 unblocked)

Full sprint table: `plan/17-standard-product-execution-playbook.md` §4

**Agent memory:** `docs/dev/codebase-index.md`, `docs/dev/known-pitfalls.md`, `docs/dev/recipes/`
