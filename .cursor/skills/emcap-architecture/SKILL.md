---
name: emcap-architecture
description: >-
  EMCAP layered architecture, monorepo layout, CQRS boundaries, and dependency
  rules. Use when designing features, adding modules, or reviewing architecture
  for the Enterprise Multi-Tenant Core Application Platform.
---

# EMCAP Architecture

## Layers (top to bottom)

1. **Presentation** — `clients/web` (Angular), `clients/mobile` (Flutter), REST/GraphQL
2. **Application** — Commands, queries, use cases (CQRS) in `platform/api`
3. **Platform services** — Identity, entity SDK, workflow, notifications, etc.
4. **Infrastructure** — PostgreSQL, Redis, Kafka, S3/MinIO via `infra/`

## Dependency rules

- `modules/` may import platform **public SDK** only — never modify `platform/`.
- `clients/` call APIs and metadata endpoints — no direct DB access.
- Optional subsystems load only when enabled in `config/platform.yaml`.
- One metadata contract drives all UI renderers.

## Monorepo paths

| Path | Purpose |
|------|---------|
| `platform/api/` | FastAPI platform core |
| `modules/` | Business plug-ins (`ModuleDefinition`) |
| `clients/` | Angular + Flutter |
| `config/` | Platform YAML |
| `infra/` | Docker, Terraform, Helm |
| `spec/sdd/` | Formal SDD artifacts |

## Before adding code

1. Identify the layer and domain (see `spec/sdd/02-architecture.md`).
2. Check if config already supports the feature (`config/platform.yaml`).
3. Confirm business logic belongs in `modules/`, not `platform/`.

## References

- `spec/sdd/02-architecture.md`
- `spec/sdd/adrs/001-monorepo-and-layered-architecture.md`
