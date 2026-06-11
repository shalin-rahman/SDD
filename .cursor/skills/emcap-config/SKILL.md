---
name: emcap-config
description: >-
  EMCAP platform YAML configuration schema for tenancy, feature flags, auth,
  and subsystem toggles. Use when editing config/platform.yaml, adding feature
  flags, or implementing config loaders.
---

# EMCAP Configuration

Primary file: `config/platform.yaml`. Loaded by `emcap.config.loader.load_platform_config()`.

Override path via `EMCAP_CONFIG_PATH` environment variable.

## Top-level keys

| Key | Purpose | SDD § |
|-----|---------|-------|
| `platform.multi_tenant` | false = single org; true = SaaS | 3 |
| `platform.white_label` | Tenant branding/domains/themes | 3 |
| `tenant_strategy.mode` | shared_database, schema_per_tenant, database_per_tenant, hybrid | 4 |
| `modules.*.enabled` | Feature flags per subsystem | 5 |
| `authentication.*` | Auth provider toggles | 7 |
| `audit.*` | Audit trail settings | 19 |
| `notifications.*` | Channel toggles | 13 |
| `grid.*` | Grid export/behavior flags | 9 |
| `workflow.*` | Workflow engine options | 10 |
| `rules.*` | Rule engine modes | 11 |
| `payments.enabled` | Payment platform | 16 |
| `ai.enabled` | AI platform | 17 |

## Pydantic models

Defined in `platform/api/src/emcap/config/models.py`. Add new config sections there first, then extend YAML.

## Rules

1. Defaults must match SDD (optional subsystems off unless documented).
2. Disabled modules must not register routes or background workers at startup.
3. Never store secrets in YAML — use environment/secrets manager.

## API introspection

`GET /api/v1/config/platform` returns loaded config (non-secret fields only).

Client shells call this at login to gate optional UI (payments, AI, notification channels). See `clients/web/src/app/main.ts` and `clients/mobile/lib/app/shell.dart`.
