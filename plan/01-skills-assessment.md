# EMCAP — Skills Assessment

Based on review of `spec/framework-sdd.txt` (EMCAP SDD v1.0).

## SDD Summary (Key Constraints)

| Area | Requirement |
|------|-------------|
| Architecture | Presentation (Angular, Flutter, REST, GraphQL) → Application (CQRS) → Platform Services → Infra (PostgreSQL, Redis, Kafka, S3) |
| Tenancy | Configurable: single-org, SaaS, enterprise white-label; 4 isolation strategies |
| Core pattern | `EntityDefinition` / `ModuleDefinition` — platform generates APIs, UI, audit, etc. |
| Quality | Unit tests ≥80% (target 90%); contract tests for metadata renderers |
| DevOps | GitFlow, Terraform/Helm/Ansible, full CI/CD pipeline |
| Definition of Done | Business modules only declare definitions; no core platform changes |

---

## Existing Cursor Skills — Relevance

| Skill | Use for EMCAP | When |
|-------|---------------|------|
| **create-skill** | Required | Authoring all EMCAP project skills below |
| **create-rule** | Required | Platform coding standards, file-specific conventions |
| **split-to-prs** | High | Breaking platform work into reviewable PRs |
| **babysit** | Medium | CI loop after pipeline exists |
| **shell** | Medium | Terraform, Docker, K8s scripting |
| **canvas** | Medium | Architecture reviews, domain maps, KPI dashboards |
| **create-hook** | Low | Optional automation (pre-commit lint, test gates) |
| **sdk** | Low | Only if automating agents in CI outside Cursor |
| **automate / loop** | Low | Not needed until ops automations are defined |

---

## New Project Skills to Create

Store under `.cursor/skills/` in this project root (`SDD/.cursor/skills/`), shared with the team when the repo is initialized.

### Tier 1 — Foundation (create before Phase 0)

| Skill name | Purpose | Trigger terms |
|------------|---------|---------------|
| `emcap-architecture` | Layer boundaries, CQRS, service domains, dependency rules | architecture, layer, platform core, module plugin |
| `emcap-config` | `platform.*`, `tenant_strategy.*`, `modules.*` YAML schema and defaults | multi_tenant, feature flags, deployment mode |
| `emcap-entity-sdk` | `EntityDefinition`, `ModuleDefinition`, code generation contract | EntityDefinition, ModuleDefinition, new entity, new module |
| `emcap-devops` | GitFlow, Docker Compose local stack, CI stages, IaC layout | Terraform, Helm, pipeline, GitFlow |

### Tier 2 — Platform Domains (create during Phase 1–2)

| Skill name | Purpose |
|------------|---------|
| `emcap-identity-authz` | Auth providers, RBAC/ABAC, row/field security |
| `emcap-multi-tenancy` | Isolation strategies, tenant context, white-label |
| `emcap-dynamic-ui` | Form/grid metadata contract, Angular + Flutter parity |
| `emcap-workflow-rules` | Workflow engine, rule engine (scripting vs formula) |
| `emcap-integrations` | REST/GraphQL/SOAP/SFTP/Kafka adapters |
| `emcap-observability` | Structured logs, Prometheus, OpenTelemetry, Grafana |

### Tier 3 — Cross-Cutting (create during Phase 2–3)

| Skill name | Purpose |
|------------|---------|
| `emcap-testing` | Coverage gates, service/repo/workflow/security/contract tests |
| `emcap-security` | OWASP Top 10, MFA, encryption, rate limiting, headers |
| `emcap-release-dr` | Semver, migrations, rollback, PITR, RPO/RTO |

---

## Project Rules to Create (`.cursor/rules/`)

| Rule file | Scope | Content |
|-----------|-------|---------|
| `emcap-core-standards.mdc` | `alwaysApply: true` | No core edits from business modules; config-driven features |
| `backend-python.mdc` | `**/*.py` | FastAPI, Ruff, Black, MyPy, CQRS patterns |
| `frontend-angular.mdc` | `**/*.{ts,html}` | ESLint, metadata-driven components only |
| `frontend-flutter.mdc` | `**/*.dart` | Flutter Analyze, shared grid/form contract |
| `infra-iac.mdc` | `**/*.{tf,yml,yaml}` | Terraform/Helm/Ansible conventions |

---

## Skill Creation Order (Recommended)

```
1. emcap-architecture
2. emcap-config
3. emcap-entity-sdk
4. emcap-devops
5. emcap-testing
   ↓ (parallel during domain work)
6. emcap-identity-authz + emcap-multi-tenancy
7. emcap-dynamic-ui
8. emcap-workflow-rules
9. emcap-integrations + emcap-observability + emcap-security
10. emcap-release-dr
```

Use **create-skill** workflow for each. Keep each `SKILL.md` under 500 lines; put SDD excerpts in `reference.md`.

---

## Human / Team Skills (Non-Cursor)

These are engineering capabilities the SDD assumes — not agent skills, but staffing considerations:

- FastAPI + PostgreSQL + Redis + Kafka
- Angular and Flutter (metadata-driven UI)
- Kubernetes, Terraform, Helm
- Workflow engines, rule engines, reporting/BI
- Payment gateway integrations (bKash, Stripe, etc.)
- Security engineering (OWASP, MFA, secrets)
