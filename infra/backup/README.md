# EMCAP PostgreSQL Backup & PITR

Operational backup layout for EMCAP PostgreSQL (SDD §29, NFR-015). Targets **RPO &lt; 15 minutes** via WAL archiving and **daily logical backups** for long-retention restore points.

## Layout

| Path | Purpose |
|------|---------|
| `scripts/daily-backup.sh` | `pg_dump` logical backup, gzip, upload hook |
| `scripts/wal-archive.sh` | WAL segment archive hook (PITR) |
| `scripts/restore-pitr.sh` | Point-in-time recovery from base + WAL |
| `postgresql/pitr.conf` | Snippet for `archive_mode` / `archive_command` |
| `k8s/cronjob-daily-backup.yaml` | Nightly backup CronJob |
| `k8s/cronjob-wal-gc.yaml` | Optional WAL retention cleanup |

## Local dev (docker-compose)

The stack in `infra/docker/docker-compose.yml` exposes PostgreSQL on `localhost:5432`:

- User: `emcap`
- Password: `emcap`
- Database: `emcap`

### One-off daily backup

```bash
cd infra/backup
export PGHOST=localhost PGPORT=5432 PGUSER=emcap PGPASSWORD=emcap PGDATABASE=emcap
export BACKUP_DIR=./backups/local
./scripts/daily-backup.sh
```

Output: `backups/local/emcap-YYYYMMDD-HHMMSS.dump.gz`

### Restore logical backup (local)

```bash
gunzip -c backups/local/emcap-20260611-020000.dump.gz | \
  psql "postgresql://emcap:emcap@localhost:5432/emcap"
```

Use `dropdb` / recreate empty DB first if restoring into a clean instance.

### PITR on local dev (optional)

1. Mount `infra/backup/postgresql/pitr.conf` and a WAL archive volume into the `postgres` service (see example override below).
2. Set `archive_command` to call `wal-archive.sh` inside the container or from a sidecar.
3. Take a **base backup** before enabling heavy write traffic:

```bash
export PGHOST=localhost PGPORT=5432 PGUSER=emcap PGPASSWORD=emcap
pg_basebackup -D ./backups/base -Fp -Xs -P
```

4. Restore to a timestamp with `scripts/restore-pitr.sh`.

#### docker-compose override example

Save as `infra/docker/docker-compose.backup.override.yml`:

```yaml
services:
  postgres:
    volumes:
      - ../backup/postgresql/pitr.conf:/etc/postgresql/conf.d/pitr.conf:ro
      - emcap-wal-archive:/var/lib/postgresql/wal_archive
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
      - -c
      - include_if_exists=/etc/postgresql/conf.d/pitr.conf

volumes:
  emcap-wal-archive:
```

Run:

```bash
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.backup.override.yml up -d postgres
```

## Production (Kubernetes / managed Postgres)

| Component | Recommendation |
|-----------|----------------|
| Managed DB (RDS, Cloud SQL, Azure Flexible) | Enable automated backups + PITR in provider console; retain ≥ 7 days |
| Self-hosted on K8s | Apply `k8s/cronjob-daily-backup.yaml`; ship WAL to object storage via `wal-archive.sh` |
| Object storage | S3-compatible bucket with versioning (MinIO in dev, cloud bucket in prod) |
| Encryption | SSE-S3 or KMS; never store credentials in git |

### Environment variables (scripts)

| Variable | Default | Description |
|----------|---------|-------------|
| `PGHOST` | `localhost` | PostgreSQL host |
| `PGPORT` | `5432` | Port |
| `PGUSER` | `emcap` | Role |
| `PGPASSWORD` | — | Password (use K8s Secret) |
| `PGDATABASE` | `emcap` | Database name |
| `BACKUP_DIR` | `/var/backups/emcap` | Local staging before upload |
| `WAL_ARCHIVE_DIR` | `/var/lib/postgresql/wal_archive` | WAL destination |
| `RETENTION_DAYS` | `30` | Daily backup retention |
| `S3_BUCKET` | — | If set, `aws s3 cp` after dump (requires AWS CLI) |
| `S3_PREFIX` | `emcap/postgres` | Key prefix |

## Schedule

| Job | Schedule | RPO contribution |
|-----|----------|------------------|
| WAL archive (continuous) | Every commit | &lt; 15 min when replayed |
| Daily logical backup | `0 2 * * *` UTC | Full restore point + off-site copy |
| WAL GC | Weekly | Cap storage cost |

## Verification (monthly)

1. Restore latest daily dump to an isolated DB; run `SELECT count(*) FROM entity_records`.
2. Perform PITR drill to a timestamp 10 minutes before test writes (see `docs/ops/dr-runbook.md`).
3. Record elapsed recovery time; target **RTO &lt; 1 hour**.

## Related docs

- DR procedures: `docs/ops/dr-runbook.md`
- Release + migrations: `docs/ops/release-process.md`
