# ADR-001: Monorepo and Layered Architecture

| Status | Accepted |
|--------|----------|
| Date | 2026-06-10 |
| Deciders | Platform architecture |

## Context

EMCAP must support many business domains (ERP, CRM, HRM, etc.) from one platform. Teams need clear boundaries between core platform code and business modules, with shared UI metadata across Angular and Flutter.

## Decision

1. Use a **monorepo** with top-level folders: `platform/`, `modules/`, `clients/`, `infra/`, `config/`.
2. Enforce **strict layering**: Presentation → Application (CQRS) → Platform Services → Infrastructure.
3. Business modules integrate only through **`ModuleDefinition` / `EntityDefinition`** — no edits to `platform/`.
4. Configuration drives tenancy mode, isolation strategy, and feature flags via **`config/platform.yaml`**.

## Consequences

**Positive**
- Single source of truth for metadata and CI.
- Clear ownership: platform team owns `platform/`; product teams own `modules/`.
- Contract tests can run in one pipeline.

**Negative**
- Monorepo requires disciplined CI (path filters, affected builds).
- Large clone size over time — mitigate with sparse checkout if needed.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Polyrepo (platform + modules separate) | Harder metadata contract enforcement and version coupling |
| Shared library without code generation | Duplicates API/UI work per module; violates SDD §8 |

## References

- SDD §6, §21, §26–27
- `spec/sdd/02-architecture.md`
