output "vpc_id" {
  description = "VPC ID."
  value       = module.network.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = module.network.private_subnet_ids
}

output "eks_cluster_name" {
  description = "EKS cluster name."
  value       = module.kubernetes.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Kubernetes API endpoint."
  value       = module.kubernetes.cluster_endpoint
}

output "postgres_endpoint" {
  description = "PostgreSQL connection endpoint."
  value       = module.postgresql.endpoint
}

output "postgres_address" {
  description = "PostgreSQL hostname."
  value       = module.postgresql.address
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint."
  value       = module.redis.primary_endpoint_address
}

output "redis_connection_url" {
  description = "Redis URL for application configuration."
  value       = module.redis.connection_url
}
