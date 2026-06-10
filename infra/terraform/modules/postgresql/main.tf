locals {
  identifier = "${var.name_prefix}-postgres"

  common_tags = merge(var.tags, {
    Module = "emcap-postgresql"
  })
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-postgres"
  subnet_ids = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-postgres-subnet-group"
  })
}

resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-postgres"
  description = "PostgreSQL access for ${var.name_prefix}"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.allowed_security_group_ids
    content {
      description     = "PostgreSQL from allowed SG"
      from_port       = var.port
      to_port         = var.port
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = var.allowed_cidr_blocks
    content {
      description = "PostgreSQL from CIDR"
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
    Name = "${var.name_prefix}-postgres-sg"
  })
}

resource "aws_db_instance" "this" {
  identifier = local.identifier

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage_gb
  max_allocated_storage = var.max_allocated_storage_gb > 0 ? var.max_allocated_storage_gb : null
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password
  port     = var.port

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  publicly_accessible    = var.publicly_accessible
  multi_az               = var.multi_az

  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.identifier}-final"

  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  tags = merge(local.common_tags, {
    Name = local.identifier
  })
}
