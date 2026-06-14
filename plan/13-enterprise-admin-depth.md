# Phase 13 — Enterprise admin depth (deferred from Phase 12)

**Status:** Slice 1 Done · **Slice 2 API Done (P13-T10/T11)** · Web UI **P19-T03 Done** · mobile field edit **P13-T12 Pending**  
**Driver:** Phase 12 shipped read-only security viewer; matrix marks ABAC builder, layout designer, isolation write as Phase 13.  
**Depends on:** Phase 12F (`GET /admin/security/policies`) · `plan/12-enterprise-product-ui.md`  
**Matrix:** `spec/sdd/06-admin-product-ui-matrix.md`  
**SDD:** §7 (authz), §9 (layout), §4 (isolation)

---

## Scope (from Phase 12 matrix)

| Item | SDD § | Risk | Phase 13 target |
|------|-------|------|-----------------|
| ABAC policy builder | §7 | Medium | Admin CRUD on attribute policies; runtime `/auth/check` uses stored policies |
| Field `read_roles` overrides | §7 | Medium | DB overrides merged at read time (module defs remain source) |
| Tenant isolation strategy **write** | §4 | High | Ops-only API + confirmation; not self-service SaaS |
| Form/grid layout designer | §9 | High | Metadata editor — separate workstream |
| In-app Grafana | §18 | Low | Link hub only (already partial in settings) |
| Runtime module install | §27 | High | Out of scope — deploy via `modules/` + config |

**Out of scope:** PCI vault, payment capture UI, new business modules.

---

## Architecture

| Concern | Decision |
|---------|----------|
| ABAC storage | `SettingOverrideRow` key `security.abac_policies` (JSON list); YAML defaults in `config/platform.yaml` |
| Runtime policies | `app.state.abac_policies` loaded at startup; refreshed on admin PUT |
| Field overrides | `security.field_overrides` JSON map `ENTITY.field` → `read_roles[]` (Slice 2) |
| Permissions | `admin.security.read` (view), `admin.security.write` (ABAC + field overrides) |
| Parity | Web + mobile + pytest + matrix row per slice |

---

## Slices (dependency order)

### Slice 1 — ABAC policy admin (P13-T01–T06)

| ID | Task |
|----|------|
| P13-T01 | `SecuritySettings` + YAML defaults; `load_abac_policies()` |
| P13-T02 | `GET/PUT /admin/security/abac`; seed `admin.security.write` |
| P13-T03 | Wire `POST /auth/check` to `app.state.abac_policies` |
| P13-T04 | Web admin security — ABAC table editor |
| P13-T05 | Mobile admin security — ABAC editor |
| P13-T06 | pytest + matrix rev. 7 |

### Slice 2 — Field access overrides (P13-T10–T14)

| ID | Task |
|----|------|
| P13-T10 | `PUT /admin/security/field-access` single-field override | **Done** |
| P13-T11 | Merge overrides in `apply_field_security` + policies GET | **Done** |
| P13-T12 | Web/mobile field row edit (permission multi-select) | Web **Done** (P19-T03); mobile Pending |
| P13-T13 | Contract test: restricted field hidden for viewer | **Done** (`test_admin_field_access_override.py`) |

### Slice 3 — Tenant isolation write (P13-T20–T22)

| ID | Task |
|----|------|
| P13-T20 | Ops API with typed confirmation token |
| P13-T21 | Settings UI gated + audit |
| P13-T22 | Runbook doc in `infra/ansible` |

### Slice 4 — Layout designer (P13-T30+)

| ID | Task |
|----|------|
| P13-T30 | ADR + metadata edit API design |
| P13-T31 | Form layout editor MVP |
| P13-T32 | Grid column editor MVP |

---

## Verification

```bat
cd platform\api && python -m pytest tests/test_admin_api.py tests/test_auth_security.py -q
cd clients\web && npm run build && npm run test:ci
```

Manual: Admin → Security → edit ABAC row → Save → Account → Check permission reflects policy.

---

## Traceability

| FR | Phase 13 tasks |
|----|----------------|
| FR-002 ABAC | P13-T01–T06 |
| FR-002 field security write | P13-T10–T13 |
| FR-003 tenant isolation | P13-T20–T22 |
| FR-008d layout designer | P13-T30+ |
