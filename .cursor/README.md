# EMCAP — project Cursor assets

All Cursor guidance for **this repo** lives here. Do not rely on user-global skills under `~/.cursor/skills-cursor/` for EMCAP work — use the files in this folder instead.

## Layout

| Path | Purpose |
|------|---------|
| `rules/` | Always-on and glob-scoped project rules (`.mdc`) |
| `skills/` | EMCAP domain skills (`SKILL.md`) for agents |

## Rules

| File | Scope |
|------|-------|
| `emcap-core-standards.mdc` | Always apply — module boundaries, config-driven design |
| `emcap-sdd-workflow.mdc` | Always apply — read index/pitfalls/recipes before coding |
| `backend-python.mdc` | `platform/api/**` |
| `frontend-angular.mdc` | `clients/web/**` |
| `frontend-flutter.mdc` | `clients/mobile/**` |
| `infra-iac.mdc` | `infra/**` |

## Skills

| Skill | Use when |
|-------|----------|
| `emcap-codebase-map` | Codebase index, pitfalls, recipes — read first |
| `emcap-architecture` | Layering, monorepo layout, ADRs |
| `emcap-config` | `config/platform.yaml` |
| `emcap-entity-sdk` | Entities, modules, CRUD |
| `emcap-identity-authz` | Auth, RBAC, ABAC, MFA |
| `emcap-multi-tenancy` | Tenant strategies, middleware |
| `emcap-dynamic-ui` | Form/grid metadata contract |
| `emcap-workflow-rules` | Workflows, formula rules |
| `emcap-testing` | pytest, contract tests |
| `emcap-integrations` | Notifications, documents, payments, AI |
| `emcap-observability` | Logging, Prometheus, Grafana |
| `emcap-security` | Middleware, feature flags |
| `emcap-devops` | Docker, CI/CD overview |
| `emcap-release-dr` | Releases, migrations, backup, DR |

## SDD status tracking

| Document | Purpose |
|----------|---------|
| `spec/sdd/04-capability-matrix.md` | Platform service status (Phase 7 complete) |
| `spec/sdd/05-end-user-matrix.md` | End-user UX status (Phase 8 complete) |
| `plan/06-sdd-gap-closure.md` | Phase 7 playbook |
| `plan/07-phase8-end-user-product.md` | Phase 8 playbook |
| `plan/03-task-backlog.md` | 131/131 task status |

Commit this `.cursor/` tree with the repo so every contributor gets the same agent context.
