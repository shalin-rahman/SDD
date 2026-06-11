# EMCAP — Known Pitfalls

Error → cause → fix → prevention test. **Check this before debugging.**

**Regression rule:** Any pitfall fix must add or extend a test.

---

## Backend

### Naive vs aware datetime comparison

| | |
|--|--|
| **Error** | `TypeError: can't compare offset-naive and offset-aware datetimes` |
| **Where** | `platform/api/src/emcap/sync/service.py` — `_record_updated_after` |
| **Cause** | DB `created_at`/`updated_at` are naive; `since` query param is UTC-aware |
| **Fix** | After parsing, if `parsed.tzinfo is None`: `parsed = parsed.replace(tzinfo=UTC)` |
| **Test** | `test_client_api_gaps.py::test_offline_sync_snapshot_and_changes` |

### EntityRegistryError in routes

| | |
|--|--|
| **Error** | Unhandled `EntityRegistryError` or wrong `KeyError` catch |
| **Where** | `api/routes/sync.py`, `notes.py` |
| **Fix** | `except EntityRegistryError as exc: raise HTTPException(404, ...)` |
| **Test** | Sync/notes tests in `test_client_api_gaps.py` |

### Create record HTTP status

| | |
|--|--|
| **Error** | Test expects `200` but API returns `201` |
| **Where** | `test_client_api_gaps.py`, entity routes |
| **Fix** | Assert `response.status_code == 201` for POST records/notes |
| **Test** | `_create_product` helper in `test_client_api_gaps.py` |

### Platform core git guard

| | |
|--|--|
| **Error** | `test_platform_core_unchanged` fails with no git baseline |
| **Where** | `test_platform_core_unchanged.py` |
| **Fix** | Skip git diff guard when no committed HEAD baseline |
| **Test** | Self-documented skip in same file |

---

## Web client

### SSE without auth headers

| | |
|--|--|
| **Error** | `EventSource` cannot send `Authorization` or `X-Tenant-ID` |
| **Where** | `clients/web/src/api/emcap-client.ts` — `subscribeRecordsStream` |
| **Fix** | Use `fetch` + `ReadableStream` with `this.headers()`, parse `data:` lines |
| **Test** | `test_client_api_gaps.py::test_realtime_stream_endpoint` (API); manual web grid refresh |

### PowerShell command chaining

| | |
|--|--|
| **Error** | `The token '&&' is not a valid statement separator` |
| **Where** | Ad-hoc terminal commands on Windows PowerShell 5.x |
| **Fix** | Use `;` or dedicated `.ps1` scripts under `scripts/` |
| **Test** | `scripts/verify-full-stack.ps1` |

---

## Mobile client

### GridMetadata missing offline/realtime

| | |
|--|--|
| **Error** | `grid.offline` undefined / compile error |
| **Where** | `clients/mobile/lib/metadata_contract.dart` |
| **Fix** | Parse `offline` and `realtime` from JSON; mirror `contract.ts` defaults |
| **Test** | Entity screen sync delta display; contract parity with API metadata |

---

## Architecture

### Business feature in platform core

| | |
|--|--|
| **Error** | Inventory-specific logic in `platform/api/src/emcap/` |
| **Fix** | Only `modules/<name>/module.py`; enable via `EntityOptions` / report defs |
| **Test** | `test_platform_core_unchanged.py`, `verify-platform-core.ps1` |

### Stale agent skills

| | |
|--|--|
| **Symptom** | Skill says "Ansible TBD" or wrong test count |
| **Fix** | Update `.cursor/skills/` and this doc; point to `docs/dev/codebase-index.md` |

---

## Phase 7 — Client parity (prevent reintroduction)

### Client method without contract test

| | |
|--|--|
| **Symptom** | New `emcap-client.ts` method ships without vitest guard |
| **Fix** | Add to `REQUIRED_METHODS` in `emcap-client.test.ts` same PR |
| **Test** | `npm test` in `clients/web` |

### Web/mobile API parity drift

| | |
|--|--|
| **Symptom** | Method exists in web only |
| **Fix** | Add matching method in `emcap_client.dart`; update `04-capability-matrix.md` |
| **Test** | Manual parity checklist in `plan/06-sdd-gap-closure.md` |

### Feature UI without config gate

| | |
|--|--|
| **Symptom** | Payments/notifications UI shown when `modules.*.enabled: false` |
| **Fix** | Read `GET /api/v1/config/platform` or health before showing nav |
| **Test** | Assert nav hidden when flag off |

### Workflow action wrong HTTP verb

| | |
|--|--|
| **Symptom** | 405 on workflow transition |
| **Fix** | Match `workflows.py` route exactly (POST body shape) |
| **Test** | `test_inventory_e2e.py` workflow lifecycle |

### Document upload missing entity context

| | |
|--|--|
| **Symptom** | 422 on upload |
| **Fix** | Body must include `entity_code`, `record_id`, `filename`, `content` |
| **Test** | `test_client_api_gaps.py::test_document_list_by_record` (seed via upload) |

### Capability matrix not updated

| | |
|--|--|
| **Symptom** | Partial/No rows stale after merge |
| **Fix** | Update `spec/sdd/04-capability-matrix.md` in same PR as UI |
| **Test** | Review checklist P7-T16 |
