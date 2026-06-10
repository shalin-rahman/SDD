---
name: emcap-release-dr
description: >-
  EMCAP semver releases, SQL migrations, deploy rollback, PostgreSQL PITR,
  and disaster recovery (RPO <15m, RTO <1h). Use when cutting releases,
  writing migrations, planning DR drills, or recovering production.
---

# EMCAP Release & DR

## Semver releases (SDD §28)

| Branch | Purpose |
|--------|---------|
| `release/X.Y.Z` | Stabilize; bump `emcap.__version__` |
| `main` | Tag `vX.Y.Z`; production source |
| `hotfix/X.Y.Z` | Patch from `main` |

Full workflow: `docs/ops/release-process.md` · GitFlow: `docs/dev/gitflow.md`

## Database migrations

- Runner: `platform/api/scripts/migrate.py`
- SQL files: `platform/api/migrations/NNN_description.sql`
- Table: `schema_migrations`

```bash
cd platform/api
DATABASE_URL=postgresql+psycopg://emcap:emcap@localhost:5432/emcap \
  python scripts/migrate.py status
python scripts/migrate.py up
python scripts/migrate.py stamp 001   # bootstrap existing DB
```

**Deploy order:** backup confirmed → `migrate.py up` → deploy API image `vX.Y.Z`.

Alembic may replace the stub later; keep numbered SQL + semver tags.

## Backup & PITR (SDD §29)

| Asset | Path / tool |
|-------|-------------|
| Docs | `infra/backup/README.md` |
| Daily dump | `infra/backup/scripts/daily-backup.sh` |
| WAL archive | `infra/backup/scripts/wal-archive.sh` |
| PITR restore | `infra/backup/scripts/restore-pitr.sh` |
| K8s CronJob | `infra/backup/k8s/cronjob-daily-backup.yaml` |
| Local compose | `infra/docker/docker-compose.yml` + optional `docker-compose.backup.override.yml` |

**RPO &lt; 15 min:** continuous WAL archiving + replay to `RECOVERY_TARGET`.  
**Daily backup:** `pg_dump` at 02:00 UTC; 30-day retention default.

## Disaster recovery

Runbook: `docs/ops/dr-runbook.md`

| Scenario | First action |
|----------|--------------|
| Bad migration | Stop writes; PITR to pre-deploy timestamp |
| Region down | Restore managed PITR or failover replica |
| Bad release | `helm rollback` / redeploy previous `vX.Y.Z-1` |
| Redis only | Restart; cache rebuilds (sessions re-auth) |

**RTO &lt; 1 hour:** maintenance mode → DB restore → migrate if needed → app rollback/deploy → smoke tests (health, auth, CRUD, metrics).

## Monthly drill

1. Restore backup to `emcap-dr-test` namespace.
2. PITR to T−10 minutes; measure elapsed time.
3. Log RPO/RTO in incident ticket template from runbook §8.

## Rollback matrix

| Layer | Action |
|-------|--------|
| App | Helm rollback or previous image tag |
| DB | PITR preferred; forward-fix migration second |
| Documents | S3/MinIO versioning restore |
| Config | Revert `config/platform.yaml` at tag |

## Traceability

- NFR-014, NFR-015 → EMCAP-P4-T09–T11 → DR drill + backup verification
