import {
  formatRoleSummary,
  groupPermissions,
  hasSelectedPermission,
  permissionGroupSummary,
  togglePermission,
  toggleWildcard,
} from '../utils/permission.util';

describe('permission.util', () => {
  const sample = ['customer.read', 'customer.create', 'admin.users.read', '*.*'];

  it('groups permissions by module prefix', () => {
    const groups = groupPermissions(sample);
    expect(groups.some((group) => group.module === 'customer')).toBeTrue();
    expect(groups.some((group) => group.module === 'admin')).toBeTrue();
    expect(groups.some((group) => group.module === 'platform')).toBeTrue();
  });

  it('detects wildcard and prefix coverage', () => {
    expect(hasSelectedPermission(['admin.*'], 'admin.users.read')).toBeTrue();
    expect(hasSelectedPermission(['customer.*'], 'customer.create')).toBeTrue();
    expect(hasSelectedPermission(['*.*'], 'inventory.read')).toBeTrue();
    expect(hasSelectedPermission(['customer.read'], 'customer.create')).toBeFalse();
    expect(hasSelectedPermission(['customer.read'], 'customer.read')).toBeTrue();
  });

  it('formats module labels including unknown codes', () => {
    const groups = groupPermissions(['inventory.read', 'sales_order.read']);
    expect(groups.find((g) => g.module === 'inventory')?.label).toBe('Inventory');
    expect(groups.find((g) => g.module === 'sales_order')?.label).toBe('Sales Order');
  });

  it('summarizes permission groups for list display', () => {
    expect(permissionGroupSummary([])).toBe('—');
    expect(permissionGroupSummary(['customer.read', 'customer.create'])).toContain('Customer (2)');
  });

  it('toggles individual permissions and wildcards', () => {
    expect(togglePermission(['customer.read'], 'customer.write', true)).toEqual([
      'customer.read',
      'customer.write',
    ]);
    expect(togglePermission(['customer.read', 'customer.write'], 'customer.write', false)).toEqual([
      'customer.read',
    ]);
    expect(toggleWildcard(['customer.read'], 'customer.*', true)).toEqual(['customer.*']);
    expect(toggleWildcard(['customer.*', 'admin.read'], 'customer.*', false)).toEqual(['admin.read']);
  });

  it('formats role summaries', () => {
    expect(formatRoleSummary([])).toBe('—');
    expect(formatRoleSummary([{ code: 'admin', name: 'Administrator' }])).toBe('Administrator');
    expect(formatRoleSummary([{ code: 'viewer', name: '' }])).toBe('viewer');
  });

  it('covers wildcard prefix matching and module fallbacks', () => {
    expect(hasSelectedPermission(['sales.*'], 'sales.order.read')).toBeTrue();
    expect(hasSelectedPermission(['customer.read'], 'customer.read')).toBeTrue();
    expect(togglePermission(['admin.*'], 'admin.users.read', true)).toContain('admin.users.read');
    expect(groupPermissions(['orphan']).some((g) => g.module === 'platform')).toBeTrue();
    expect(groupPermissions(['admin.*']).some((g) => g.module === 'platform')).toBeTrue();
  });
});