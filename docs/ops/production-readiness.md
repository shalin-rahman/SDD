# Production readiness checklist (Phase 7 P7-T15)

SDD NFR-001, NFR-002, NFR-008, NFR-015. Complete before production cutover.

## Availability (99.9%)

- [ ] Kubernetes deployment with ≥2 API replicas (`infra/helm/emcap-api/values-prod.yaml`)
- [ ] PodDisruptionBudget configured
- [ ] Health checks: liveness + readiness on `/api/v1/health`
- [ ] RDS Multi-AZ or equivalent (`infra/terraform/modules/postgresql/`)

## Scalability

- [ ] Horizontal Pod Autoscaler (HPA) on CPU/memory
- [ ] Redis/ElastiCache for session/cache layer
- [ ] Stateless API (no local disk state)

## Multi-region (ready)

- [ ] Document primary/DR region pairing
- [ ] S3/MinIO replication strategy documented
- [ ] DNS failover runbook section in `docs/ops/dr-runbook.md`

## Disaster recovery

- [ ] Daily backup job (`infra/backup/` scripts) tested
- [ ] PITR restore drill logged (target RPO <15m, RTO <1h)
- [ ] `platform/api/scripts/migrate.py status` on deploy

## Verification

```powershell
.\scripts\verify-full-stack.ps1
helm template infra/helm/emcap-api -f infra/helm/emcap-api/values-prod.yaml
```

Sign-off: _______________ Date: _______________
