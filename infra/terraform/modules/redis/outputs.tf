output "replication_group_id" {
  description = "ElastiCache replication group ID."
  value       = aws_elasticache_replication_group.this.id
}

output "primary_endpoint_address" {
  description = "Primary Redis endpoint hostname."
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Reader endpoint when replicas exist."
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "port" {
  description = "Redis port."
  value       = aws_elasticache_replication_group.this.port
}

output "security_group_id" {
  description = "Security group ID for the Redis cluster."
  value       = aws_security_group.this.id
}

output "connection_url" {
  description = "Redis URL for application configuration."
  value       = "redis://${aws_elasticache_replication_group.this.primary_endpoint_address}:${aws_elasticache_replication_group.this.port}/0"
}
