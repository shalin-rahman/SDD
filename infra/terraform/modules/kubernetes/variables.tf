variable "name_prefix" {
  description = "Prefix for cluster and IAM resource names."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the cluster is deployed."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for worker nodes and control plane ENIs."
  type        = list(string)
}

variable "kubernetes_version" {
  description = "EKS control plane version."
  type        = string
  default     = "1.29"
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes."
  type        = number
  default     = 3
}

variable "node_disk_size_gb" {
  description = "Root volume size (GiB) for worker nodes."
  type        = number
  default     = 50
}

variable "endpoint_public_access" {
  description = "Allow public API server endpoint (restrict via allowed_cidr_blocks in non-dev)."
  type        = bool
  default     = true
}

variable "endpoint_private_access" {
  description = "Allow private API server endpoint within the VPC."
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitted to reach the public Kubernetes API endpoint."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Additional tags applied to cluster resources."
  type        = map(string)
  default     = {}
}
