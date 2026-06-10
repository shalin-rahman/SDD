output "instance_id" {
  description = "RDS instance identifier."
  value       = aws_db_instance.this.id
}

output "instance_arn" {
  description = "RDS instance ARN."
  value       = aws_db_instance.this.arn
}

output "endpoint" {
  description = "Connection endpoint (host:port)."
  value       = aws_db_instance.this.endpoint
}

output "address" {
  description = "Database hostname."
  value       = aws_db_instance.this.address
}

output "port" {
  description = "Database port."
  value       = aws_db_instance.this.port
}

output "database_name" {
  description = "Initial database name."
  value       = aws_db_instance.this.db_name
}

output "security_group_id" {
  description = "Security group ID for the RDS instance."
  value       = aws_security_group.this.id
}

output "connection_url_template" {
  description = "SQLAlchemy-style URL template; substitute password at deploy time."
  value       = "postgresql+psycopg://${aws_db_instance.this.username}:<password>@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${aws_db_instance.this.db_name}"
  sensitive   = true
}
