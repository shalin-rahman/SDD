# Inventory Module — Definition of Done (SDD §30)

Reference sign-off for EMCAP Phase 5. The Inventory module (`modules/inventory/module.py`) declares only `ModuleDefinition(entities, workflows, reports, dashboards, menus)` and receives platform capabilities without modifying `platform/api/src/emcap/`.

**Module:** `INVENTORY` · **Entities:** `PRODUCT`, `WAREHOUSE` · **Sign-off date:** 2026-06-11

---

## Capability checklist

| SDD §30 capability | Verification method | Inventory evidence |
|--------------------|---------------------|-------------------|
| Authentication | `test_auth_security.py::test_password_login`, `test_oauth_client_credentials` | `POST /api/v1/auth/login`, `POST /api/v1/auth/oauth/token` |
| Authorization (RBAC/ABAC) | `test_auth_security.py::test_rbac_roles`, `test_abac_check` | `GET /api/v1/auth/roles`, `POST /api/v1/auth/check`; permission `inventory.access` in `GET /api/v1/permissions` |
| Multi-tenancy (optional) | `test_auth_security.py::test_tenant_header_isolation`; `test_postgres_integration.py::test_tenant_isolation_with_postgres` | `X-Tenant-ID` header on `POST/GET /api/v1/entities/PRODUCT/records`; `GET /api/v1/tenants` |
| Localization | `test_metadata_workflow.py::test_metadata_contract_keys`; `test_inventory_e2e.py::test_product_metadata_contract_keys` | `i18n` keys on `GET /api/v1/metadata/forms/PRODUCT`, `GET /api/v1/metadata/grids/PRODUCT` |
| Dynamic forms | `test_inventory_e2e.py::test_product_form_metadata_api` | `GET /api/v1/metadata/forms/PRODUCT` |
| Dynamic grids | `test_inventory_e2e.py::test_product_grid_metadata_api` | `GET /api/v1/metadata/grids/PRODUCT` |
| Mobile UI (metadata contract) | `clients/mobile/lib/metadata_contract.dart`; `test_product_metadata_contract_keys` | Shared schema with web; Flutter `validateFormMetadata` / `validateGridMetadata` |
| Reporting | `test_inventory_e2e.py::test_inventory_valuation_report`; `test_client_api_gaps.py::test_low_stock_report_filter` | `GET /api/v1/reports`, `POST /api/v1/reports/INVENTORY_VALUATION/run`, `POST /api/v1/reports/LOW_STOCK/run` (qty < reorder), `GET /api/v1/reports/INVENTORY_VALUATION/runs`; web/mobile Reports nav (`listReports`, `runReport`) |
| Dashboards | `test_inventory_e2e.py::test_inventory_overview_dashboard` | `GET /api/v1/dashboards` → `INVENTORY_OVERVIEW` |
| Notifications | `test_platform_services.py::test_notification_hub` | `POST /api/v1/notifications/send`, `GET /api/v1/notifications` |
| Documents | `test_platform_services.py::test_document_upload_and_get`; `test_client_api_gaps.py::test_document_list_by_record` | `POST /api/v1/documents/upload`, `GET /api/v1/documents/{id}`, `GET /api/v1/documents?entity_code=&record_id=` |
| Notes | `test_client_api_gaps.py::test_notes_crud`; `EntityOptions.notes_enabled=True` on `PRODUCT`, `WAREHOUSE` | `GET/POST /api/v1/entities/{entity}/records/{id}/notes`; web `EmcapClient.listNotes` / `addNote` |
| Offline sync | `test_client_api_gaps.py::test_offline_sync_snapshot_and_changes` | `GET /api/v1/sync/{entity}/snapshot`, `GET /api/v1/sync/{entity}/changes?since=`; clients `syncSnapshot()` |
| Realtime (SSE) | `test_client_api_gaps.py::test_realtime_stream_endpoint` | `GET /api/v1/entities/{entity}/records/stream`; grid `realtime` flag in metadata |
| Workflow | `test_inventory_e2e.py::test_stock_adjustment_workflow_lifecycle`; `test_client_api_gaps.py::test_workflow_instance_list` | `POST /api/v1/workflows/STOCK_ADJUSTMENT/start`, `GET /api/v1/workflows/instances`, `GET .../instances/{id}`, transition/delegate |
| Audit | `test_health.py::test_customer_crud_and_audit`; `test_platform_core_unchanged.py::test_inventory_capabilities_via_generic_platform_apis` | `GET /api/v1/entities/PRODUCT/audit` after CRUD |
| Search | `test_health.py::test_customer_crud_and_audit`; `test_platform_core_unchanged.py` (search param) | `GET /api/v1/entities/PRODUCT/records?q=CORE` |
| APIs (auto CRUD) | `test_inventory_e2e.py::test_product_crud`, `test_warehouse_crud` | `POST/GET/PUT/DELETE /api/v1/entities/{PRODUCT\|WAREHOUSE}/records` |
| Menus | `test_inventory_e2e.py::test_inventory_menus` | `GET /api/v1/menus` → `products`, `warehouses` under module `INVENTORY` |
| Permissions | `test_health.py::test_menus_and_permissions`; inventory module definition | `inventory.access`, auto-generated `product.*` / `warehouse.*` via `GET /api/v1/permissions` |
| Monitoring | `test_health.py::test_health_returns_tenant_mode` | `GET /api/v1/health` |
| DevOps integration | `.github/workflows/ci.yml` (lint, unit, integration, security jobs) | CI runs pytest including inventory e2e on push/PR |
| Deployment automation | `.github/workflows/deploy-{dev,uat,production}.yml`; `modules/inventory/deploy/manifest.yaml` | Standalone module mount at `/opt/emcap/modules/inventory` |
| Observability | `test_platform_services.py::test_prometheus_metrics` | `GET /api/v1/metrics`; JSON logging middleware on all routes |
| Security controls | `test_auth_security.py::test_security_headers`, `test_mfa_enroll_and_verify` | Security headers on `GET /api/v1/health`; MFA on `/api/v1/auth/mfa/*`; rate limiting middleware |
| Zero platform core changes | `test_platform_core_unchanged.py`; `scripts/verify-platform-core.sh` / `.ps1` | Inventory under `modules/inventory/` only; `git diff platform/api/src/emcap/` empty |

---

## Sign-off table

| Item | Owner | Verified | Date | Notes |
|------|-------|----------|------|-------|
| Authentication | Platform QA | ☑ | 2026-06-11 | Username/password + OAuth providers |
| Authorization | Platform QA | ☑ | 2026-06-11 | RBAC roles + ABAC check |
| Multi-tenancy | Platform QA | ☑ | 2026-06-11 | Header-based isolation; config `multi_tenant: false` default |
| Localization | Platform QA | ☑ | 2026-06-11 | Metadata `i18n` contract |
| Dynamic forms | Platform QA | ☑ | 2026-06-11 | PRODUCT form metadata |
| Dynamic grids | Platform QA | ☑ | 2026-06-11 | PRODUCT grid metadata + export flags |
| Mobile UI contract | Platform QA | ☑ | 2026-06-11 | Flutter metadata validators |
| Reporting | Module owner | ☑ | 2026-06-11 | `INVENTORY_VALUATION`, `LOW_STOCK`; client Reports UI (Phase 6) |
| Dashboards | Module owner | ☑ | 2026-06-11 | `INVENTORY_OVERVIEW` widgets |
| Notifications | Platform QA | ☑ | 2026-06-11 | Email channel enabled in config |
| Documents | Platform QA | ☑ | 2026-06-11 | Upload, get-by-id, list-by-record |
| Notes | Module owner | ☑ | 2026-06-11 | API CRUD on PRODUCT/WAREHOUSE; web client wired |
| Offline sync | Platform QA | ☑ | 2026-06-11 | Snapshot + changes; clients show `sync_version` |
| Realtime (SSE) | Platform QA | ☑ | 2026-06-11 | Stream endpoint; web + mobile grid refresh when `grid.realtime` |
| Workflow | Module owner | ☑ | 2026-06-11 | `STOCK_ADJUSTMENT` lifecycle; inbox transition/delegate in shells |
| Audit | Platform QA | ☑ | 2026-06-11 | Immutable audit trail; record detail audit viewer in shells |
| Client UI (Phase 7) | Module owner | ☑ | 2026-06-11 | Upload, notifications, dashboards, permissions, CSV export (web) |
| Search | Platform QA | ☑ | 2026-06-11 | Query param search on entity records |
| APIs | Module owner | ☑ | 2026-06-11 | PRODUCT + WAREHOUSE CRUD |
| Menus | Module owner | ☑ | 2026-06-11 | Products and warehouses navigation |
| Permissions | Module owner | ☑ | 2026-06-11 | `inventory.access` module permission |
| Monitoring | Platform QA | ☑ | 2026-06-11 | Health endpoint |
| DevOps integration | DevOps | ☑ | 2026-06-11 | CI pipeline green |
| Deployment automation | DevOps | ☑ | 2026-06-11 | Helm/Ansible + module manifest |
| Observability | Platform QA | ☑ | 2026-06-11 | Prometheus metrics endpoint |
| Security controls | Security | ☑ | 2026-06-11 | Headers, MFA, rate limits |
| Zero core changes | Architecture | ☑ | 2026-06-11 | P5-T05 guard tests + verify script |

**Overall module status:** **Complete** — SDD §30 Definition of Done satisfied via plug-in model only.

---

## How to re-verify

```bash
# From repo root
cd platform/api && pytest -q tests/test_inventory_e2e.py tests/test_client_api_gaps.py tests/test_platform_core_unchanged.py

# Informational platform-core diff (always exit 0)
bash scripts/verify-platform-core.sh
# Windows
powershell -File scripts/verify-platform-core.ps1
```
