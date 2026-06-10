output "cluster_name" {
  description = "EKS cluster name."
  value       = aws_eks_cluster.this.name
}

output "cluster_arn" {
  description = "EKS cluster ARN."
  value       = aws_eks_cluster.this.arn
}

output "cluster_endpoint" {
  description = "Kubernetes API server endpoint."
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64-encoded CA certificate for kubectl."
  value       = aws_eks_cluster.this.certificate_authority[0].data
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "Security group attached to the EKS control plane."
  value       = aws_security_group.cluster.id
}

output "node_group_arn" {
  description = "Managed node group ARN."
  value       = aws_eks_node_group.default.arn
}

output "node_role_arn" {
  description = "IAM role ARN used by worker nodes."
  value       = aws_iam_role.node.arn
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for IRSA setup."
  value       = aws_eks_cluster.this.identity[0].oidc[0].issuer
}
