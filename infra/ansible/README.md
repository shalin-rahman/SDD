# EMCAP Ansible (Phase 4)

Bootstrap a deploy runner and install the `emcap-api` Helm release. Assumes AWS EKS and supporting resources from `infra/terraform/`, chart at `infra/helm/emcap-api/`.

## Layout

```
infra/ansible/
├── ansible.cfg
├── bootstrap.yml          # kubectl/helm + kubeconfig
├── deploy-emcap.yml       # helm upgrade --install emcap-api
├── inventory/
│   ├── dev.yml
│   └── uat.yml
└── group_vars/
    ├── all.yml
    ├── dev.yml            # secret placeholders
    └── uat.yml
```

## Prerequisites

- Ansible 2.14+ on the deploy runner (Linux CI agent or ops workstation)
- AWS CLI configured for the target account (`AWS_PROFILE` or IAM role)
- EKS cluster already provisioned (`terraform apply` in `infra/terraform/environments/dev`)
- Container image pushed to your registry (see `infra/helm/README.md`)

Do **not** commit real secrets. Override placeholders via CI variables, Ansible Vault, or extra vars files ignored by git.

## Quick start — dev

From the repository root:

```bash
cd infra/ansible

# 1) Bootstrap tools and kubeconfig (stub install on Linux; skips if already present)
ansible-playbook -i inventory/dev.yml bootstrap.yml

# 2) Deploy API (edit group_vars/dev.yml or pass overrides)
ansible-playbook -i inventory/dev.yml deploy-emcap.yml \
  -e emcap_image_repository=123456789012.dkr.ecr.us-east-1.amazonaws.com/emcap/api
```

## UAT

```bash
cd infra/ansible
ansible-playbook -i inventory/uat.yml bootstrap.yml
ansible-playbook -i inventory/uat.yml deploy-emcap.yml \
  -e emcap_image_repository=123456789012.dkr.ecr.us-east-1.amazonaws.com/emcap/api
```

## Secret overrides

`group_vars/dev.yml` and `group_vars/uat.yml` contain placeholder values only. Example override file (keep out of git):

```yaml
# secrets-dev.yml (example — do not commit)
emcap_secrets:
  database_url: "postgresql+psycopg://emcap:REAL_PASSWORD@postgres.emcap-dev.svc:5432/emcap"
  jwt_secret: "real-jwt-secret-from-vault"
```

```bash
ansible-playbook -i inventory/dev.yml deploy-emcap.yml -e @secrets-dev.yml
```

## Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `emcap_env` | `group_vars/{dev,uat}.yml` | Values file suffix (`values-dev.yaml`) |
| `emcap_namespace` | env group_vars | Kubernetes namespace |
| `eks_cluster_name` | env group_vars | Passed to `aws eks update-kubeconfig` |
| `aws_region` | env group_vars | AWS region for EKS |
| `emcap_image_repository` | env group_vars / `-e` | Container registry path |
| `emcap_secrets.*` | env group_vars / Vault | Helm `--set secrets.*` overrides |
| `configure_kubeconfig` | `-e` | Set `false` to skip kubeconfig update |
| `helm_extra_args` | `-e` | Extra flags (e.g. `--dry-run`) |

## Verify

```bash
kubectl -n emcap-dev get pods,svc,ingress -l app=emcap-api
curl -s https://emcap-api.dev.local/api/v1/health
```

## Related

- Terraform: `infra/terraform/README.md`
- Helm: `infra/helm/README.md`
- SDD traceability: `EMCAP-P4-T03` → NFR-008, NFR-009

## Tenant isolation strategy write (P13-T20 / P13-T22)

**Read isolation** (entity CRUD tenant scoping) is verified by `docs/dev/recipes/tenant-isolation-write-test.md`.

**Ops write** (change effective isolation strategy):

1. Set `EMCAP_OPS_CONFIRMATION_TOKEN` in the API environment (default dev token documented in `ops_service.py`).
2. Caller must have `admin.ops` (included in `admin.*`).
3. `PUT /api/v1/admin/ops/tenant-isolation` with body `{ "mode": "database_per_tenant", "confirmation_token": "…" }`.
4. `GET /api/v1/admin/ops/tenant-isolation` returns configured vs effective mode.
5. **Production:** prefer Helm/env override of `tenant_strategy.mode` over runtime ops PUT; use ops API only for controlled drills.

Tests: `platform/api/tests/test_admin_ops_isolation.py`.
