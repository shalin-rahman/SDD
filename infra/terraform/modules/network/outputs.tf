output "vpc_id" {
  description = "VPC identifier."
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs (load balancers, NAT)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (EKS nodes, RDS, Redis)."
  value       = aws_subnet.private[*].id
}

output "availability_zones" {
  description = "AZs used by subnets."
  value       = local.azs
}

output "nat_gateway_id" {
  description = "NAT gateway ID when enabled, otherwise null."
  value       = try(aws_nat_gateway.this[0].id, null)
}
