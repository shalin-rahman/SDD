# EMCAP Disaster Recovery Runbook

**Objectives (SDD §29):** RPO **&lt; 15 minutes** · RTO **&lt; 1 hour**

**Scope:** PostgreSQL (primary state), object storage (documents), Redis (cache — rebuildable), application tier (stateless).

**On-call roles:** Incident commander (IC), DBA, Platform engineer, Comms.

---

## 1. Severity and triggers

| Scenario | Example | Primary path |
|----------|---------|--------------|
| **S1 — Data loss / corrupt DB** | Bad migration, accidental DELETE | PITR or daily restore |
| **S2 — Region / cluster down** | AZ failure, K8s control plane | Failover + restore from backup |
| **S3 — Partial service** | API pods crash, Redis down | Rollback deploy; Redis optional |

Declare incident in your status channel. IC assigns DBA + platform engineer.

---

## 2. Preconditions checklist

Before any restore:

- [ ] Confirm incident scope (which tenants, which services).
- [ ] **Stop writes:** scale API to 0 or enable maintenance mode at ingress.
- [ ] Note **recovery target time** (UTC) — last known good state, typically 5–10 min before error.
- [ ] Verify backup availability (daily dump + WAL or managed PITR window).
- [ ] Open war room doc; log every command and timestamp (RTO measurement).

---

## 3. PostgreSQL recovery

### 3A. Managed database (preferred production)

**AWS RDS / Cloud SQL / Azure Flexible Server**

1. Console → **Restore to point in time** (or restore from automated snapshot).
2. Choose timestamp ≤ recovery target; new instance name e.g. `emcap-pg-dr-YYYYMMDD`.
3. Update `DATABASE_URL` in K8s Secret / Helm values to new endpoint.
4. Run smoke tests (§5); repoint application.
5. Decommission failed instance after 24h soak.

**Expected duration:** 20–40 minutes (within RTO).

### 3B. Self-hosted — point-in-time (PITR)

Uses `infra/backup/scripts/restore-pitr.sh` and WAL archive.

```bash
export PGDATA=/var/lib/postgresql/data-dr
export BASE_BACKUP_DIR=/backups/base/latest
export WAL_ARCHIVE_DIR=/var/lib/postgresql/wal_archive
export RECOVERY_TARGET=2026-06-11T14:25:00Z   # UTC, before bad event

# Stop postgres on DR node; ensure PGDATA is empty
./infra/backup/scripts/restore-pitr.sh

# Start PostgreSQL 16; wait for log: "database system is ready to accept connections"
# and recovery promotion
```

Update `DATABASE_URL` to DR host. Run migrations only if DR copy is **behind** release tag (§4).

### 3C. Self-hosted — daily logical backup

When PITR is unavailable or full refresh is acceptable (RPO up to 24h):

```bash
# From infra/backup — local example against docker-compose postgres
export PGHOST=localhost PGPORT=5432 PGUSER=emcap PGPASSWORD=emcap PGDATABASE=emcap

dropdb -h $PGHOST -U $PGUSER emcap || true
createdb -h $PGHOST -U $PGUSER emcap

gunzip -c /backups/daily/emcap-YYYYMMDD-HHMMSS.dump.gz | \
  pg_restore -h $PGHOST -U $PGUSER -d emcap --no-owner --role=emcap
```

For custom-format dumps from `daily-backup.sh`:

```bash
gunzip -c backup.dump.gz | pg_restore -h $PGHOST -U $PGUSER -d emcap --no-owner
```

**Expected duration:** 15–30 minutes for typical EMCAP volumes.

---

## 4. Application tier

1. **Rollback deploy** (if bad release caused outage):

   ```bash
   helm rollback emcap-api <previous-revision> -n emcap
   ```

   Or redeploy last known good image tag from CI (see `docs/ops/release-process.md`).

2. **Database migrations:** If restored DB schema revision **&lt;** app expects, run:

   ```bash
   cd platform/api
   DATABASE_URL=postgresql+psycopg://... python scripts/migrate.py up
   ```

   If restored DB is **newer** than app, rollback app — do not run `down` on production without IC approval.

3. Scale API back up; verify health endpoint.

---

## 5. Object storage (documents)

MinIO/S3 holds document blobs referenced by `documents.storage_key`.

| Step | Action |
|------|--------|
| 1 | Enable bucket **versioning** (required in prod). |
| 2 | If bucket lost: restore from cross-region replica or versioned backup. |
| 3 | Reconcile DB: rows without blobs → mark `virus_scan_status=missing` via support script. |

Document metadata lives in PostgreSQL; restore DB **before** or **with** storage restore.

---

## 6. Redis

Cache only. No restore required for RTO:

```bash
# Flush and warm on startup, or deploy fresh Redis PVC
kubectl rollout restart deployment/emcap-redis -n emcap
```

Sessions (if stored in Redis) invalidate — users re-authenticate.

---

## 7. Smoke tests (gate before traffic)

Run in order; all must pass before removing maintenance mode.

| # | Check | Command / endpoint |
|---|-------|-------------------|
| 1 | API health | `GET /api/v1/health` → 200 |
| 2 | Config load | `GET /api/v1/config/platform` |
| 3 | Auth | Login with test user |
| 4 | CRUD sample | `GET /api/v1/entities/CUSTOMER` (or tenant entity) |
| 5 | Document read | Upload/download test file if storage restored |
| 6 | Metrics | `GET /api/v1/metrics` scrapes |

Record wall-clock time from **incident start** to **step 6 pass** → must be **&lt; 60 minutes**.

---

## 8. Communication template

```
[RESOLVED|IN PROGRESS] EMCAP DR — <date>
Impact: <tenants / all>
Root cause: <brief>
Recovery: PITR to <timestamp UTC> | daily backup <date>
RPO achieved: ~<N> minutes
RTO achieved: <N> minutes
Follow-up: post-incident review within 5 business days
```

---

## 9. Monthly DR drill

1. Restore latest backup to isolated namespace `emcap-dr-test`.
2. PITR to timestamp 10 minutes before synthetic test transaction.
3. Run §7 smoke tests.
4. Document RPO/RTO in ticket; file gaps (backup missing, slow restore, wrong Secret).

Scripts: `infra/backup/README.md` · Release rollback: `docs/ops/release-process.md`

---

## 10. Escalation

| Condition | Action |
|-----------|--------|
| Restore &gt; 45 min elapsed | Escalate to engineering lead |
| PITR window insufficient | Fall back to daily backup; accept RPO tradeoff |
| Data unrecoverable | Legal/comms per tenant SLA |
