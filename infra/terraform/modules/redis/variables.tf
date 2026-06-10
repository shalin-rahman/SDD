variable "name_prefix" {
  description = "Prefix for ElastiCache resource names."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the cache security group."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the cache subnet group."
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security groups permitted to connect on the Redis port (e.g. EKS cluster SG)."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "Optional CIDR blocks permitted to connect (prefer security groups in production)."
  type        = list(string)
  default     = []
}

variable "engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "node_type" {
  description = "ElastiCache node instance type."
  type        = string
  default     = "cache.t4g.micro"
}

variable "port" {
  description = "Redis port."
  type        = number
  default     = 6379
}

variable "num_cache_clusters" {
  description = "Number of cache nodes (1 for dev; 2+ enables replica for UAT)."
  type        = number
  default     = 1
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover (requires num_cache_clusters >= 2)."
  type        = bool
  default     = false
}

variable "at_rest_encryption_enabled" {
  description = "Encrypt data at rest."
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Encrypt data in transit (requires auth token when true)."
  type        = bool
  default     = false
}

variable "auth_token" {
  description = "Redis AUTH token when transit encryption is enabled. Supply via TF_VAR; never commit."
  type        = string
  sensitive   = true
  default     = null
}

variable "snapshot_retention_limit" {
  description = "Days to retain automatic snapshots (0 disables)."
  type        = number
  default     = 1
}

variable "tags" {
  description = "Additional tags applied to ElastiCache resources."
  type        = map(string)
  default     = {}
}
