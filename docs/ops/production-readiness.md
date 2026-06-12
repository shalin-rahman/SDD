# Production readiness checklist (Phase 7–8)

SDD NFR-001, NFR-002, NFR-008, NFR-015. Study-repo tabletop verification — physical prod sign-off still required before cutover.

**Tabletop verified:** 2026-06-11 · `helm template` + `verify-full-stack.ps1` + CI coverage gate 80%

## Availability (99.9%)

- [x] Kubernetes deployment with ≥2 API replicas (`infra/helm/emcap-api/values-prod.yaml` — `replicaCount: 3`)
- [x] PodDisruptionBudget documented in Helm chart templates
- [x] Health checks: liveness + readiness on `/api/v1/health`
- [x] RDS Multi-AZ documented (`infra/terraform/modules/postgresql/`)

## Scalability

- [x] HPA template notes in Helm values (enable per cluster)
- [x] Redis/ElastiCache layer in Terraform modules
- [x] Stateless API (no local disk state for sessions)

## Multi-region (ready)

- [x] Primary/DR region pairing documented in `docs/ops/dr-runbook.md`
- [x] S3/MinIO replication strategy in DR runbook
- [x] DNS failover section in `docs/ops/dr-runbook.md`

## Disaster recovery

- [x] Daily backup scripts (`infra/backup/`)
- [x] PITR restore drill steps in DR runbook (RPO <15m, RTO <1h targets)
- [x] `platform/api/scripts/migrate.py status` documented on deploy

## Client & quality gates (Phase 8)

- [x] Backend pytest coverage ≥80% in CI
- [x] Web renderer contract tests (Angular Karma CI)
- [x] Flutter `metadata_contract_test.dart`
- [x] Web + mobile end-user matrix rows Done or Stub

## Verification

```powershell
.\scripts\lint-format.bat
.\scripts\verify-full-stack.ps1
scripts\run-emcap.bat --stack-only
helm template infra/helm/emcap-api -f infra/helm/emcap-api/values-prod.yaml
cd platform/api; python -m pytest -q --cov=src --cov-fail-under=80
cd clients/web; npm run format:check; npm run lint; npm run build; npm run test:ci
cd clients/mobile; flutter test
```

**Test counts:** 71 pytest · Angular format+lint+Karma · 4 flutter · backend ~90% (gate 80%).

Sign-off (production cutover): _______________ Date: _______________
