export interface PermissionGroup {
  module: string;
  label: string;
  permissions: string[];
}

const MODULE_LABELS: Record<string, string> = {
  admin: 'Administration',
  customer: 'Customer',
  product: 'Product',
  inventory: 'Inventory',
  crm: 'CRM',
  platform: 'Platform',
};

export function formatModuleLabel(code: string): string {
  return (
    MODULE_LABELS[code] ??
    code
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

export function permissionModule(permission: string): string {
  if (permission === '*.*' || permission.endsWith('.*')) {
    return 'platform';
  }
  const dot = permission.indexOf('.');
  return dot > 0 ? permission.slice(0, dot) : 'platform';
}

export function groupPermissions(permissions: string[]): PermissionGroup[] {
  const map = new Map<string, string[]>();
  for (const permission of permissions) {
    const module = permissionModule(permission);
    const list = map.get(module) ?? [];
    list.push(permission);
    map.set(module, list);
  }
  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([module, items]) => ({
      module,
      label: formatModuleLabel(module),
      permissions: [...items].sort(),
    }));
}

export function hasSelectedPermission(selected: string[], permission: string): boolean {
  if (selected.includes(permission) || selected.includes('*.*')) {
    return true;
  }
  const module = permissionModule(permission);
  if (selected.includes(`${module}.*`)) {
    return true;
  }
  if (selected.includes('admin.*') && module === 'admin') {
    return true;
  }
  for (const entry of selected) {
    if (entry.endsWith('.*')) {
      const prefix = entry.slice(0, -1);
      if (permission.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
}

export function togglePermission(selected: string[], permission: string, enabled: boolean): string[] {
  const next = new Set(selected.filter((entry) => !entry.endsWith('.*') || entry === permission));
  if (enabled) {
    next.add(permission);
  } else {
    next.delete(permission);
  }
  return Array.from(next).sort();
}

export function toggleWildcard(selected: string[], wildcard: string, enabled: boolean): string[] {
  const module = wildcard.replace('.*', '');
  const withoutModule = selected.filter(
    (entry) => entry !== wildcard && permissionModule(entry) !== module,
  );
  if (enabled) {
    return [...withoutModule, wildcard].sort();
  }
  return withoutModule.sort();
}

export function formatRoleSummary(roles: Array<{ code: string; name: string }>): string {
  if (roles.length === 0) {
    return '—';
  }
  return roles.map((role) => role.name || role.code).join(', ');
}

export function permissionGroupSummary(permissions: string[]): string {
  if (permissions.length === 0) {
    return '—';
  }
  return groupPermissions(permissions)
    .map((group) => `${group.label} (${group.permissions.length})`)
    .join(', ');
}
