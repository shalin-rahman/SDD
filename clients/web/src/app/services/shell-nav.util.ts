import type { MenuItem } from '../api/emcap-client';

export interface ModuleNavGroup {
  moduleCode: string;
  moduleLabel: string;
  items: MenuItem[];
}

export interface PlatformNavLink {
  label: string;
  labelKey?: string;
  route: string;
  visible: boolean;
}

const PLATFORM_MODULE_KEYS = new Set(['workflow', 'payments', 'notifications', 'ai']);

export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('*.*') || permissions.includes(required)) {
    return true;
  }
  for (const entry of permissions) {
    if (entry.endsWith('.*')) {
      const prefix = entry.slice(0, -1);
      if (required.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
}

export function menuPermission(menu: MenuItem): string {
  if (menu.permission && menu.permission !== 'read') {
    return menu.permission;
  }
  return `${menu.entity_code.toLowerCase()}.read`;
}

export function isModuleEnabled(
  moduleCode: string,
  modules: Record<string, { enabled?: boolean }> | undefined,
): boolean {
  const key = moduleCode.toLowerCase();
  if (!PLATFORM_MODULE_KEYS.has(key)) {
    return true;
  }
  return modules?.[key]?.enabled !== false;
}

export function filterMenus(
  menus: MenuItem[],
  userPermissions: string[],
  modules: Record<string, { enabled?: boolean }> | undefined,
): MenuItem[] {
  return menus.filter((menu) => {
    if (!isModuleEnabled(menu.module, modules)) {
      return false;
    }
    return hasPermission(userPermissions, menuPermission(menu));
  });
}

export function groupMenusByModule(menus: MenuItem[]): ModuleNavGroup[] {
  const map = new Map<string, MenuItem[]>();
  for (const menu of menus) {
    const code = menu.module || 'platform';
    const list = map.get(code) ?? [];
    list.push(menu);
    map.set(code, list);
  }
  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([moduleCode, items]) => ({
      moduleCode,
      moduleLabel: formatModuleLabel(moduleCode),
      items: [...items].sort((a, b) => a.label.localeCompare(b.label)),
    }));
}

export function formatModuleLabel(code: string): string {
  if (code === 'platform') {
    return 'Platform';
  }
  return code
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildPlatformLinks(
  modules: Record<string, { enabled?: boolean }> | undefined,
  userPermissions: string[] = ['*.*'],
): PlatformNavLink[] {
  const links: PlatformNavLink[] = [
    {
      labelKey: 'platform.workflow.title',
      label: 'Workflow tasks',
      route: '/app/workflow',
      visible: modules?.workflow?.enabled !== false,
    },
    { labelKey: 'platform.reports.title', label: 'Reports', route: '/app/reports', visible: true },
    {
      labelKey: 'platform.dashboards.title',
      label: 'Dashboards',
      route: '/app/dashboards',
      visible: true,
    },
    {
      labelKey: 'platform.notifications.title',
      label: 'Notifications',
      route: '/app/notifications',
      visible: modules?.notifications?.enabled !== false,
    },
    { labelKey: 'platform.account.title', label: 'Account', route: '/app/account', visible: true },
    {
      labelKey: 'platform.assistant.title',
      label: 'Assistant',
      route: '/app/assistant',
      visible: modules?.ai?.enabled === true,
    },
  ];
  if (
    hasPermission(userPermissions, 'admin.users.read') ||
    hasPermission(userPermissions, 'admin.roles.read') ||
    hasPermission(userPermissions, 'admin.*')
  ) {
    links.push({ labelKey: 'nav.admin', label: 'Admin', route: '/app/admin/users', visible: true });
  }
  if (hasPermission(userPermissions, 'admin.settings.read') || hasPermission(userPermissions, 'admin.*')) {
    links.push({ labelKey: 'nav.settings', label: 'Settings', route: '/app/settings', visible: true });
  }
  return links;
}
