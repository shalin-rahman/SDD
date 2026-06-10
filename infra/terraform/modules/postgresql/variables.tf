variable "name_prefix" {
  description = "Prefix for RDS resource names."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the DB security group."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group."
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security groups permitted to connect on the DB port (e.g. EKS cluster SG)."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "Optional CIDR blocks permitted to connect (prefer security groups in production)."
  type        = list(string)
  default     = []
}

variable "engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "16.3"
}

variable "instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage_gb" {
  description = "Initial allocated storage in GiB."
  type        = number
  default     = 20
}

variable "max_allocated_storage_gb" {
  description = "Maximum storage for autoscaling (0 disables autoscaling)."
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Initial database name."
  type        = string
  default     = "emcap"
}

variable "master_username" {
  description = "Master database username."
  type        = string
  default     = "emcap"
}

variable "master_password" {
  description = "Master database password. Supply via TF_VAR or secrets manager; never commit."
  type        = string
  sensitive   = true
}

variable "port" {
  description = "PostgreSQL port."
  type        = number
  default     = 5432
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment (recommended for UAT/production)."
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Automated backup retention in days."
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Prevent accidental deletion."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on destroy (dev only)."
  type        = bool
  default     = true
}

variable "publicly_accessible" {
  description = "Expose the instance on a public IP (keep false)."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags applied to RDS resources."
  type        = map(string)
  default     = {}
}
