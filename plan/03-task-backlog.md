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
| 12 — Enterprise product UI & admin | 33 | 18 | 7 | 58 |
| **Total** | **180** | **18** | **7** | **205** |

**Status legend:** Done · Pending · Partial (started, not complete)

**Last updated:** 2026-06-12 · Phase 12B/C core landed · **Doc sync mandatory** (`emcap-doc-sync.mdc`)

**Current focus:** Phase **13** Slice 1 (ABAC admin) done. Next: field override editor (P13-T10) or layout designer plan.

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
| EMCAP-P7-T13 | CI coverage gates ≥80% + contract expansion | T03–T09 | Done |
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
| EMCAP-P12B-T09 | Auth provider settings UI | T02 | Partial |
| EMCAP-P12C-T01 | Admin settings read/write API | — | Done |
| EMCAP-P12C-T02 | Settings hub + module toggles UI | T01 | Partial |
| EMCAP-P12C-T03 | Notification template model + API | — | Done |
| EMCAP-P12C-T04 | Email template editor UI | T03 | Done |
| EMCAP-P12C-T05 | Payment provider config UI | T02 | Done |
| EMCAP-P12C-T06 | Audit log for settings changes | T01 | Done |
| EMCAP-P12C-T07 | Tenant branding admin | T02 | Partial |
| EMCAP-P12C-T08 | Workflow subsystem toggles UI | T02 | Done |
| EMCAP-P12C-T09 | Rule engine toggles UI | T02 | Done |
| EMCAP-P12C-T10 | Grid platform flags UI | T02 | Done |
| EMCAP-P12C-T11 | Integration registry UI | T02 | Done |
| EMCAP-P12C-T12 | Document platform settings UI | T02 | Pending |
| EMCAP-P12C-T13 | AI module config UI | T02 | Done |
| EMCAP-P12C-T14 | Audit subsystem config UI | T02 | Done |
| EMCAP-P12C-T15 | Report schedule admin UI (read-only list + run) | T02 | Done |
| EMCAP-P12C-T16 | SMS/push channel + template stub | T03 | Partial |
| EMCAP-P12C-T17 | Tenant isolation strategy read-only | T02 | Done |
| EMCAP-P12C-T18 | Observability links in settings | T02 | Done |
| EMCAP-P12C-T19 | Security settings section | T02 | Partial |
| EMCAP-P12D-T01 | Mobile module-grouped nav | P12A-T02 | Done |
| EMCAP-P12D-T02 | Mobile master–detail entity | P12A-T04 | Done |
| EMCAP-P12D-T03 | Mobile theme + locale | P12A-T06–T07 | Done |
| EMCAP-P12D-T04 | Mobile admin users/roles + permission picker | P12B | Done |
| EMCAP-P12D-T05 | Mobile settings hub (toggles, templates, audit) | P12C | Partial |
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
| EMCAP-P13-T10 | Field `read_roles` override API | T06 | Pending |
| EMCAP-P13-T20 | Tenant isolation write (ops) | — | Pending |
| EMCAP-P13-T30 | Layout designer ADR | — | Pending |

Playbook: `plan/12-enterprise-product-ui.md` · **Phase 13:** `plan/13-enterprise-admin-depth.md` · **12F:** `plan/12f-ui-polish-admin-depth.md` · DoD: `plan/12-phase12-dod-checklist.md` · Gap: `spec/sdd/06-admin-product-ui-matrix.md`

---

## Immediate Next Steps

**Phase 12 in progress — 12G platform i18n + report schedules done; ABAC editor deferred to Phase 13.**

1. **Always** run `docs/dev/recipes/sync-docs-after-change.md` with code changes
2. Next: **P12C-T12** (document settings UI), **P12B-T09** (auth provider UI), or **Phase 13** ABAC editor plan
3. Reuse `clients/web/src/app/shared/` — see `shared/README.md`

**Agent memory:** `docs/dev/codebase-index.md`, `docs/dev/known-pitfalls.md`, `docs/dev/recipes/`
