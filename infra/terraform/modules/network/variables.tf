variable "name_prefix" {
  description = "Prefix for resource names and tags."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to spread subnets across. Defaults to the first two available in the region."
  type        = list(string)
  default     = null
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "enable_nat_gateway" {
  description = "Create a NAT gateway for private subnet egress (single NAT for dev cost savings)."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags applied to all network resources."
  type        = map(string)
  default     = {}
}
