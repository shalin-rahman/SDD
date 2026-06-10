variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-west-1"
}

variable "project" {
  description = "Project name used in resource naming."
  type        = string
  default     = "emcap"
}

variable "environment" {
  description = "Environment name (dev, uat, prod)."
  type        = string
  default     = "dev"
}

# --- Network ---

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (one per AZ)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs (one per AZ)."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateway for private subnet egress."
  type        = bool
  default     = true
}

# --- Kubernetes (EKS) ---

variable "kubernetes_version" {
  description = "EKS control plane version."
  type        = string
  default     = "1.29"
}

variable "node_instance_types" {
  description = "Worker node instance types."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired worker node count."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum worker node count."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum worker node count."
  type        = number
  default     = 3
}

variable "eks_endpoint_public_access" {
  description = "Expose the Kubernetes API publicly."
  type        = bool
  default     = true
}

variable "eks_allowed_cidr_blocks" {
  description = "CIDR blocks allowed to reach the public EKS API endpoint."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# --- PostgreSQL (RDS) ---

variable "postgres_engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "16.3"
}

variable "postgres_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "postgres_allocated_storage_gb" {
  description = "Initial RDS storage (GiB)."
  type        = number
  default     = 20
}

variable "postgres_database_name" {
  description = "Initial database name."
  type        = string
  default     = "emcap"
}

variable "postgres_master_username" {
  description = "Master database username."
  type        = string
  default     = "emcap"
}

variable "postgres_master_password" {
  description = "Master database password. Set via TF_VAR_postgres_master_password or secrets manager."
  type        = string
  sensitive   = true
}

variable "postgres_multi_az" {
  description = "Enable Multi-AZ for RDS."
  type        = bool
  default     = false
}

variable "postgres_backup_retention_days" {
  description = "RDS backup retention in days."
  type        = number
  default     = 7
}

variable "postgres_deletion_protection" {
  description = "Prevent accidental RDS deletion."
  type        = bool
  default     = false
}

variable "postgres_skip_final_snapshot" {
  description = "Skip final snapshot on destroy (dev only)."
  type        = bool
  default     = true
}

# --- Redis (ElastiCache) ---

variable "redis_engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_num_cache_clusters" {
  description = "Number of Redis cache nodes."
  type        = number
  default     = 1
}

variable "redis_automatic_failover_enabled" {
  description = "Enable Redis automatic failover (requires 2+ nodes)."
  type        = bool
  default     = false
}

variable "redis_transit_encryption_enabled" {
  description = "Enable Redis in-transit encryption."
  type        = bool
  default     = false
}

variable "redis_auth_token" {
  description = "Redis AUTH token when transit encryption is enabled."
  type        = string
  sensitive   = true
  default     = null
}
