# EMCAP Terraform (Phase 4)

AWS-oriented Terraform modules for EMCAP cloud infrastructure. Modules use generic naming where possible so equivalents (Azure VNet, AKS, Flexible Server, Azure Cache) can mirror the same interfaces later.

## Layout

```
infra/terraform/
├── modules/
│   ├── network/       # VPC, subnets, IGW, NAT
│   ├── kubernetes/    # EKS cluster + managed node group
│   ├── postgresql/    # RDS PostgreSQL
│   └── redis/         # ElastiCache Redis
└── environments/
    └── dev/             # Example root module wiring all modules
```

## Quick start (dev)

```bash
cd infra/terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars   # optional; edit region/sizing

export TF_VAR_postgres_master_password="$(openssl rand -base64 24)"

terraform init
terraform plan
terraform apply
```

Configure AWS credentials via standard mechanisms (`AWS_PROFILE`, IAM role, etc.). Do **not** commit passwords or `terraform.tfvars` containing secrets.

## Module interfaces

### `modules/network`

| Input | Description | Default |
|-------|-------------|---------|
| `name_prefix` | Resource name prefix | *(required)* |
| `vpc_cidr` | VPC CIDR | `10.0.0.0/16` |
| `public_subnet_cidrs` | Public subnet CIDRs (per AZ) | `10.0.1.0/24`, `10.0.2.0/24` |
| `private_subnet_cidrs` | Private subnet CIDRs (per AZ) | `10.0.11.0/24`, `10.0.12.0/24` |
| `availability_zones` | Override AZ list | first N AZs in region |
| `enable_nat_gateway` | Single NAT for private egress | `true` |
| `tags` | Extra tags | `{}` |

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC ID |
| `vpc_cidr_block` | VPC CIDR |
| `public_subnet_ids` | Public subnet IDs |
| `private_subnet_ids` | Private subnet IDs |
| `availability_zones` | AZs in use |
| `nat_gateway_id` | NAT gateway ID (null if disabled) |

### `modules/kubernetes`

| Input | Description | Default |
|-------|-------------|---------|
| `name_prefix` | Cluster/IAM name prefix | *(required)* |
| `vpc_id` | Target VPC | *(required)* |
| `subnet_ids` | Private subnets for nodes/control plane | *(required)* |
| `kubernetes_version` | EKS version | `1.29` |
| `node_instance_types` | Worker instance types | `["t3.medium"]` |
| `node_desired_size` / `min` / `max` | Node group scaling | `2` / `1` / `3` |
| `node_disk_size_gb` | Root volume size | `50` |
| `endpoint_public_access` | Public API endpoint | `true` |
| `endpoint_private_access` | Private API endpoint | `true` |
| `allowed_cidr_blocks` | Public API CIDR allowlist | `["0.0.0.0/0"]` |
| `tags` | Extra tags | `{}` |

| Output | Description |
|--------|-------------|
| `cluster_name` | EKS cluster name |
| `cluster_arn` | Cluster ARN |
| `cluster_endpoint` | API server URL |
| `cluster_certificate_authority_data` | CA cert (sensitive) |
| `cluster_security_group_id` | Control plane SG (used by RDS/Redis ingress) |
| `node_group_arn` | Managed node group ARN |
| `node_role_arn` | Worker IAM role ARN |
| `oidc_issuer_url` | OIDC issuer for IRSA |

### `modules/postgresql`

| Input | Description | Default |
|-------|-------------|---------|
| `name_prefix` | RDS name prefix | *(required)* |
| `vpc_id` | Target VPC | *(required)* |
| `subnet_ids` | Private subnets for subnet group | *(required)* |
| `master_password` | Master password | *(required, sensitive)* |
| `allowed_security_group_ids` | SGs allowed on port 5432 | `[]` |
| `allowed_cidr_blocks` | Optional CIDR allowlist | `[]` |
| `engine_version` | PostgreSQL version | `16.3` |
| `instance_class` | RDS class | `db.t4g.micro` |
| `allocated_storage_gb` | Initial storage | `20` |
| `max_allocated_storage_gb` | Storage autoscale cap | `100` |
| `database_name` | Initial DB name | `emcap` |
| `master_username` | Master user | `emcap` |
| `multi_az` | Multi-AZ deployment | `false` |
| `backup_retention_days` | Backup retention | `7` |
| `deletion_protection` | Deletion protection | `false` |
| `skip_final_snapshot` | Skip snapshot on destroy | `true` |
| `tags` | Extra tags | `{}` |

| Output | Description |
|--------|-------------|
| `instance_id` / `instance_arn` | RDS identifiers |
| `endpoint` / `address` / `port` | Connection details |
| `database_name` | Database name |
| `security_group_id` | RDS security group |
| `connection_url_template` | SQLAlchemy URL template (sensitive) |

### `modules/redis`

| Input | Description | Default |
|-------|-------------|---------|
| `name_prefix` | Cache name prefix | *(required)* |
| `vpc_id` | Target VPC | *(required)* |
| `subnet_ids` | Private subnets for subnet group | *(required)* |
| `allowed_security_group_ids` | SGs allowed on port 6379 | `[]` |
| `allowed_cidr_blocks` | Optional CIDR allowlist | `[]` |
| `engine_version` | Redis version | `7.1` |
| `node_type` | Node instance type | `cache.t4g.micro` |
| `num_cache_clusters` | Node count | `1` |
| `automatic_failover_enabled` | Failover (needs ≥2 nodes) | `false` |
| `at_rest_encryption_enabled` | Encryption at rest | `true` |
| `transit_encryption_enabled` | TLS in transit | `false` |
| `auth_token` | AUTH token when TLS enabled | `null` |
| `snapshot_retention_limit` | Snapshot retention days | `1` |
| `tags` | Extra tags | `{}` |

| Output | Description |
|--------|-------------|
| `replication_group_id` | Replication group ID |
| `primary_endpoint_address` | Primary hostname |
| `reader_endpoint_address` | Reader hostname |
| `port` | Redis port |
| `security_group_id` | Cache security group |
| `connection_url` | `redis://host:port/0` |

## Dev vs UAT sizing

**Dev** defaults (in `environments/dev`):

| Component | Dev default |
|-----------|-------------|
| EKS nodes | `t3.medium`, 1–3 nodes (desired 2) |
| PostgreSQL | `db.t4g.micro`, 20 GiB, single-AZ |
| Redis | `cache.t4g.micro`, 1 node |
| NAT | Single NAT gateway |

**UAT** (override via `terraform.tfvars` or a separate `environments/uat` copy):

| Component | UAT suggestion |
|-----------|----------------|
| EKS nodes | `t3.large`, desired 3, max 5 |
| PostgreSQL | `db.t4g.small`, 50 GiB, `multi_az = true` |
| Redis | `cache.t4g.small`, 2 nodes, `automatic_failover_enabled = true` |
| Protection | `postgres_deletion_protection = true`, `postgres_skip_final_snapshot = false` |

## Wiring notes

- `environments/dev` places EKS, RDS, and Redis in **private subnets**.
- RDS and Redis ingress is restricted to the **EKS cluster security group** (not open VPC CIDR).
- Database credentials are **variables only** — inject via `TF_VAR_*`, CI secrets, or AWS Secrets Manager (integration in a later task).
- Provider versions are pinned in each module's `versions.tf` (`aws ~> 5.0`, Terraform `>= 1.5.0`).

## Related

- Local stack: `infra/docker/docker-compose.yml`
- Helm charts (Phase 4): `infra/helm/`
- SDD traceability: `EMCAP-P4-T01` → NFR-008, NFR-009
