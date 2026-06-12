export function tenantId(tenant: Record<string, unknown>): string {
  return String(tenant.id ?? tenant.code ?? 'default');
}

export function tenantLabel(tenant: Record<string, unknown>): string {
  return String(tenant.name ?? tenant.code ?? tenant.id);
}

export function extractUserPermissions(me: Record<string, unknown>): string[] {
  const perms = me['permissions'];
  if (Array.isArray(perms)) {
    return perms.map(String);
  }
  return ['*.*'];
}

export function extractModuleToggles(
  config: Record<string, unknown>,
): Record<string, { enabled?: boolean }> | undefined {
  return config.modules as Record<string, { enabled?: boolean }> | undefined;
}
