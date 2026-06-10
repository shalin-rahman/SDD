locals {
  replication_group_id = "${var.name_prefix}-redis"

  common_tags = merge(var.tags, {
    Module = "emcap-redis"
  })

  automatic_failover = var.automatic_failover_enabled && var.num_cache_clusters >= 2
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-redis"
  subnet_ids = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-redis-subnet-group"
  })
}

resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-redis"
  description = "Redis access for ${var.name_prefix}"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.allowed_security_group_ids
    content {
      description     = "Redis from allowed SG"
      from_port       = var.port
      to_port         = var.port
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = var.allowed_cidr_blocks
    content {
      description = "Redis from CIDR"
      from_port   = var.port
      to_port     = var.port
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-redis-sg"
  })
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = local.replication_group_id
  description          = "EMCAP Redis for ${var.name_prefix}"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  port                 = var.port
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [aws_security_group.this.id]

  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = local.automatic_failover
  multi_az_enabled           = local.automatic_failover

  at_rest_encryption_enabled  = var.at_rest_encryption_enabled
  transit_encryption_enabled  = var.transit_encryption_enabled
  auth_token                  = var.transit_encryption_enabled ? var.auth_token : null
  snapshot_retention_limit    = var.snapshot_retention_limit

  tags = merge(local.common_tags, {
    Name = local.replication_group_id
  })
}
