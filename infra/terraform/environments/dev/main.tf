terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "emcap"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project
  }
}

module "network" {
  source = "../../modules/network"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  tags                 = local.common_tags
}

module "kubernetes" {
  source = "../../modules/kubernetes"

  name_prefix             = local.name_prefix
  vpc_id                  = module.network.vpc_id
  subnet_ids              = module.network.private_subnet_ids
  kubernetes_version      = var.kubernetes_version
  node_instance_types     = var.node_instance_types
  node_desired_size       = var.node_desired_size
  node_min_size           = var.node_min_size
  node_max_size           = var.node_max_size
  endpoint_public_access  = var.eks_endpoint_public_access
  allowed_cidr_blocks     = var.eks_allowed_cidr_blocks
  tags                    = local.common_tags
}

module "postgresql" {
  source = "../../modules/postgresql"

  name_prefix                = local.name_prefix
  vpc_id                     = module.network.vpc_id
  subnet_ids                 = module.network.private_subnet_ids
  allowed_security_group_ids = [module.kubernetes.cluster_security_group_id]
  engine_version             = var.postgres_engine_version
  instance_class             = var.postgres_instance_class
  allocated_storage_gb       = var.postgres_allocated_storage_gb
  database_name              = var.postgres_database_name
  master_username            = var.postgres_master_username
  master_password            = var.postgres_master_password
  multi_az                   = var.postgres_multi_az
  backup_retention_days      = var.postgres_backup_retention_days
  deletion_protection        = var.postgres_deletion_protection
  skip_final_snapshot        = var.postgres_skip_final_snapshot
  tags                       = local.common_tags
}

module "redis" {
  source = "../../modules/redis"

  name_prefix                = local.name_prefix
  vpc_id                     = module.network.vpc_id
  subnet_ids                 = module.network.private_subnet_ids
  allowed_security_group_ids = [module.kubernetes.cluster_security_group_id]
  engine_version             = var.redis_engine_version
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_num_cache_clusters
  automatic_failover_enabled = var.redis_automatic_failover_enabled
  transit_encryption_enabled = var.redis_transit_encryption_enabled
  auth_token                 = var.redis_auth_token
  tags                       = local.common_tags
}
