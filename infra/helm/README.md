# Helm charts — EMCAP Phase 4

Kubernetes releases for the EMCAP platform. Assumes a cluster provisioned via `infra/terraform/`.

## Charts

| Chart | Path | Description |
|-------|------|-------------|
| `emcap-api` | `infra/helm/emcap-api/` | FastAPI API, Ingress, ConfigMap (`platform.yaml`), Secrets, optional worker stub |

Standard pod label: `app=emcap-api`.

## Prerequisites

- Kubernetes cluster (from Terraform Phase 4)
- `kubectl` configured for the target cluster
- Helm 3.x
- Container image built from `infra/docker/Dockerfile` and pushed to your registry
- PostgreSQL reachable from the cluster (Terraform-managed or external)

## Build and push image

```bash
docker build -f infra/docker/Dockerfile -t <registry>/emcap/api:dev .
docker push <registry>/emcap/api:dev
```

## Install — dev

```bash
helm upgrade --install emcap-api infra/helm/emcap-api \
  --namespace emcap-dev --create-namespace \
  -f infra/helm/emcap-api/values-dev.yaml \
  --set image.repository=<registry>/emcap/api \
  --set secrets.databaseUrl='postgresql+psycopg://emcap:SECRET@postgres.emcap-dev.svc:5432/emcap' \
  --set secrets.jwtSecret='CHANGE-ME-dev-jwt-secret'
```

## Install — UAT

```bash
helm upgrade --install emcap-api infra/helm/emcap-api \
  --namespace emcap-uat --create-namespace \
  -f infra/helm/emcap-api/values-uat.yaml \
  --set image.repository=<registry>/emcap/api \
  --set secrets.databaseUrl='postgresql+psycopg://emcap:SECRET@postgres.emcap-uat.svc:5432/emcap' \
  --set secrets.jwtSecret='CHANGE-ME-uat-jwt-secret'
```

## Install — production

```bash
helm upgrade --install emcap-api infra/helm/emcap-api \
  --namespace emcap-prod --create-namespace \
  -f infra/helm/emcap-api/values-prod.yaml \
  --set image.repository=<registry>/emcap/api \
  --set secrets.databaseUrl='postgresql+psycopg://emcap:SECRET@postgres.emcap-prod.svc:5432/emcap' \
  --set secrets.jwtSecret='CHANGE-ME-prod-jwt-secret' \
  --set secrets.oauthClientSecret='CHANGE-ME-oauth-secret'
```

## Verify

```bash
kubectl -n emcap-dev get pods,svc,ingress -l app=emcap-api
curl -s https://emcap-api.dev.local/api/v1/health
```

Or use port-forward when Ingress is disabled:

```bash
kubectl -n emcap-dev port-forward svc/emcap-api 8000:8000
curl http://localhost:8000/api/v1/health
```

## Configuration

| Source | Mount / env | Purpose |
|--------|-------------|---------|
| ConfigMap `*-config` | `/config/platform.yaml` | Platform feature flags, tenancy, modules |
| Secret `*-secrets` | env vars | `DATABASE_URL`, `EMCAP_JWT_SECRET`, OAuth credentials |

Override `config.platformYaml` in values files or use an external Secret/ConfigMap by setting `secrets.create: false` and wiring `extraEnv`.

## Worker stub

Set `worker.enabled: true` (default in `values-prod.yaml`) to deploy a placeholder worker Deployment sharing the same image and config. Replace `worker.command` when the background worker entrypoint is implemented.

## Uninstall

```bash
helm uninstall emcap-api -n emcap-dev
```

## Dry-run / lint

```bash
helm lint infra/helm/emcap-api
helm template emcap-api infra/helm/emcap-api \
  -f infra/helm/emcap-api/values-dev.yaml \
  --set secrets.databaseUrl='postgresql+psycopg://u:p@host:5432/emcap' \
  --set secrets.jwtSecret='test-secret'
```
