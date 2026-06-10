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
| `backend-python.mdc` | `platform/api/**` |
| `frontend-angular.mdc` | `clients/web/**` |
| `frontend-flutter.mdc` | `clients/mobile/**` |
| `infra-iac.mdc` | `infra/**` |

## Skills

| Skill | Use when |
|-------|----------|
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

Commit this `.cursor/` tree with the repo so every contributor gets the same agent context.
