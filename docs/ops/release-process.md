# EMCAP Release Process

Semver release workflow (SDD §28), database migrations, and rollback. Complements `docs/dev/gitflow.md`.

**Version format:** `MAJOR.MINOR.PATCH` (e.g. `1.4.2`)

| Bump | When |
|------|------|
| MAJOR | Breaking API or incompatible schema |
| MINOR | Backward-compatible features |
| PATCH | Bug fixes, security patches |

Application version lives in `platform/api/src/emcap/__init__.py` (`__version__`). Git tags use `v` prefix: `v1.4.2`.

---

## 1. Release branch workflow

```
develop ──► release/1.4.0 ──► main (tag v1.4.0)
                  │
                  └──────────► develop (merge back)
```

1. From `develop`, create `release/X.Y.Z`.
2. Bump `__version__` to `X.Y.Z`; update changelog (if maintained).
3. Freeze features; only bug fixes on release branch.
4. CI green: lint, unit tests, integration tests (when P4-T04+ enabled).
5. Deploy to **UAT**; sign-off from product/QA.
6. Merge to `main`; tag:

   ```bash
   git tag -a v1.4.0 -m "Release 1.4.0"
   git push origin v1.4.0
   ```

7. Merge `release/X.Y.Z` back to `develop`.
8. CI deploys **production** from `main` tag (P4-T08 pipeline).

### Hotfix

```
main ──► hotfix/1.4.1 ──► main (tag v1.4.1) + develop
```

Patch version only; include migration if schema fix requires it.

---

## 2. Database migrations

EMCAP uses SQL migrations applied by `platform/api/scripts/migrate.py`. Alembic can replace this stub later; keep the same semver tagging rules.

### Layout

```
platform/api/
  migrations/
    001_baseline.sql
    002_add_example_index.sql
  scripts/
    migrate.py
```

Each file: `{version}_{description}.sql` where `version` is a zero-padded integer applied in sort order.

### Commands

```bash
cd platform/api
export DATABASE_URL=postgresql+psycopg://emcap:emcap@localhost:5432/emcap

# Show pending/applied
python scripts/migrate.py status

# Apply all pending
python scripts/migrate.py up

# Apply through specific version
python scripts/migrate.py up --to 002

# Record version without running SQL (bootstrap existing DB)
python scripts/migrate.py stamp 001
```

### Authoring a migration

1. Create `migrations/00N_short_desc.sql` on `feature/*` branch.
2. SQL must be **backward compatible** when possible (expand-contract pattern):
   - Add nullable columns / new tables first.
   - Deploy app reading old + new schema.
   - Remove deprecated columns in a later release.
3. PR must include migration + app code in same release (or migration-only patch safe for old app).
4. Never edit applied migration files; add a new `00N+1` fix.

### Release tagging with migrations

| Release tag | Migration set | Notes |
|-------------|---------------|-------|
| `v1.3.0` | through `003` | Document in release notes |
| `v1.4.0` | adds `004`, `005` | Run `migrate.py up` before or during deploy |

**Deploy order (production):**

1. Snapshot / confirm PITR window (`infra/backup/`).
2. Run `migrate.py up` against production DB (job or init container).
3. Deploy API image tagged `vX.Y.Z`.
4. Smoke tests (`GET /api/v1/health`, sample CRUD).

If migration fails: **stop**; do not deploy new app. Restore DB from PITR if partial apply (see `docs/ops/dr-runbook.md`).

---

## 3. Rollback

| Layer | Action |
|-------|--------|
| **Application** | `helm rollback emcap-api <rev>` or redeploy previous image `vX.Y.(Z-1)` |
| **Database** | Prefer forward-fix migration. `migrate.py` has no automatic `down` — restore PITR if destructive change shipped |
| **Config** | Revert `config/platform.yaml` via git tag; redeploy |

Rollback checklist:

- [ ] Maintenance mode on
- [ ] Roll back app to last green tag
- [ ] If schema incompatible: PITR to pre-deploy timestamp OR apply hotfix migration
- [ ] Smoke tests
- [ ] Maintenance mode off

---

## 4. CI/CD integration (Phase 4)

| Stage | Action |
|-------|--------|
| Build | Tag image `emcap-api:vX.Y.Z` and `emcap-api:git-sha` |
| UAT | `migrate.py up` then deploy tag |
| Prod | Manual approval; same migrate + deploy |
| Rollback job | Redeploy `vX.Y.Z-1` (P4-T08) |

---

## 5. Compatibility rules

- **API:** additive changes only in MINOR/PATCH; breaking changes require MAJOR + deprecation period.
- **Migrations:** must not break currently deployed app version during rolling deploy.
- **Modules:** business modules version independently; declare `min_platform_version` in module metadata when introduced.

---

## 6. Release checklist

- [ ] Version bumped in `emcap/__init__.py`
- [ ] Migrations numbered and tested locally against docker-compose Postgres
- [ ] `python scripts/migrate.py status` clean on fresh DB
- [ ] Release notes list migration IDs
- [ ] UAT sign-off
- [ ] Tag `vX.Y.Z` on `main`
- [ ] Post-deploy: metrics and error rate normal 30 min

**Related:** `infra/backup/README.md` · `docs/ops/dr-runbook.md` · `.cursor/skills/emcap-release-dr/SKILL.md`
