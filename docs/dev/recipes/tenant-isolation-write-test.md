# Recipe — Tenant isolation write test (P19-T07)

Verify that records created under one `X-Tenant-ID` header are **not visible** to another tenant on list/read paths.

---

## Automated tests

| Test file | Test | Marker | What it proves |
|-----------|------|--------|----------------|
| `platform/api/tests/test_auth_security.py` | `test_tenant_header_isolation` | unit (SQLite) | POST under `tenant-a` → list under `tenant-b` returns `[]` |
| `platform/api/tests/test_postgres_integration.py` | `test_tenant_isolation_with_postgres` | `integration` | Same contract against real PostgreSQL in CI |

### Run unit gate (no Docker)

```bat
cd platform\api
python -m pytest tests/test_auth_security.py::test_tenant_header_isolation -q
```

### Run integration gate (Postgres service container or local PG)

```bat
cd platform\api
set DATABASE_URL=postgresql+psycopg://emcap:emcap@localhost:5432/emcap
python -m pytest tests/test_postgres_integration.py::test_tenant_isolation_with_postgres -m integration -q
```

CI: `.github/workflows/ci.yml` **integration** job sets `DATABASE_URL` and runs `pytest -q -m integration`.

---

## Manual write isolation check (no Docker)

When Docker is unavailable, use SQLite local stack:

```bat
cd platform\api
set DATABASE_URL=sqlite:///:memory:
set EMCAP_CONFIG_PATH=..\..\config\platform-test.yaml
set EMCAP_MODULES_PATH=..\..\modules
uvicorn emcap.main:create_app --factory --port 8000
```

In a second terminal (or REST client):

```http
POST /api/v1/entities/CUSTOMER/records
X-Tenant-ID: tenant-a
Content-Type: application/json

{"name": "Tenant A", "email": "a@example.com"}
```

```http
GET /api/v1/entities/CUSTOMER/records
X-Tenant-ID: tenant-b
```

**Expected:** `200` with `"records": []`.

```http
GET /api/v1/entities/CUSTOMER/records
X-Tenant-ID: tenant-a
```

**Expected:** `200` with one record.

---

## Manual write isolation check (Docker stack)

```bat
scripts\run-emcap.bat --stack-only
```

Repeat the HTTP steps above against `http://localhost:8000`. Postgres persistence survives API restarts — re-list with `tenant-b` after restart to confirm isolation is stored, not in-memory only.

---

## Related

- `docs/dev/known-pitfalls.md` — tenant header + SSE auth notes
- `spec/sdd/06-admin-product-ui-matrix.md` — multi-tenant admin posture
- `.cursor/skills/emcap-multi-tenancy/SKILL.md` — tenancy modes
