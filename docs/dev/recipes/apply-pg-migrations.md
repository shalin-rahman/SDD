# Recipe — Apply PostgreSQL migrations (P21-T02)

EMCAP SQL migrations live in `platform/api/migrations/`. The runner is `platform/api/scripts/migrate.py`.

**SQLite local dev** (`--local`) uses `init_db()` + `_apply_sqlite_schema_patches()` — do **not** run `002_system_columns.sql` on SQLite; it is PostgreSQL-only (`TIMESTAMPTZ`, `IF NOT EXISTS` on `ALTER`).

---

## Prerequisites

| Mode | Requirement |
|------|-------------|
| Docker stack | `scripts\run-emcap.bat --stack-only` (Postgres on port 5432) |
| Manual PG | PostgreSQL 16+ with database `emcap` |

Default connection (Docker Compose):

```
DATABASE_URL=postgresql+psycopg://emcap:emcap@localhost:5432/emcap
```

---

## Check status

```bat
cd platform\api
set DATABASE_URL=postgresql+psycopg://emcap:emcap@localhost:5432/emcap
python scripts\migrate.py status
```

Expected after fresh stack + apply:

```
001  [applied]  001_baseline.sql
002  [applied]  002_system_columns.sql
003  [applied]  003_tenant_layout_override.sql

0 pending
```

---

## Apply pending migrations

```bat
cd platform\api
set DATABASE_URL=postgresql+psycopg://emcap:emcap@localhost:5432/emcap
python scripts\migrate.py up
```

Stop at a version:

```bat
python scripts\migrate.py up --to 002
```

---

## Bootstrap existing DB (stamp only)

If `entity_records` already has system columns from `init_db()`:

```bat
python scripts\migrate.py stamp 002
```

---

## Manual apply (no Python)

Run `migrations/002_system_columns.sql` in `psql` against the target database, then insert into `schema_migrations`:

```sql
INSERT INTO schema_migrations (version) VALUES ('002');
```

---

## Verify

```bat
cd platform\api
python -m pytest tests/test_migrations.py -q
```

Integration CI job runs `python scripts/migrate.py up` against the Postgres service container before `pytest -m integration` (see `.github/workflows/ci.yml` integration job).

---

## Related

- `docs/ops/release-process.md` — deploy order
- `platform/api/migrations/002_system_columns.sql` — P21-T01 system columns
- `platform/api/migrations/003_tenant_layout_override.sql` — P13-T31 layout overrides (ADR-007)
- `docs/dev/recipes/run-emcap-local-stack.md` — start Docker stack
