import { PermissionGroup, groupPermissions, hasSelectedPermission, permissionGroupSummary } from '../utils/permission.util';

describe('permission.util', () => {
  const sample = ['customer.read', 'customer.create', 'admin.users.read', 'admin.*'];

  it('groups permissions by module prefix', () => {
    const groups = groupPermissions(sample);
    expect(groups.some((group) => group.module === 'customer')).toBeTrue();
    expect(groups.some((group) => group.module === 'admin')).toBeTrue();
  });

  it('detects wildcard coverage', () => {
    expect(hasSelectedPermission(['admin.*'], 'admin.users.read')).toBeTrue();
    expect(hasSelectedPermission(['customer.read'], 'customer.create')).toBeFalse();
  });

  it('formats module labels', () => {
    const groups: PermissionGroup[] = groupPermissions(['inventory.read']);
    expect(groups[0].label).toBe('Inventory');
  });

  it('summarizes permission groups for list display', () => {
    expect(permissionGroupSummary([])).toBe('—');
    expect(permissionGroupSummary(['customer.read', 'customer.create'])).toContain('Customer (2)');
  });
});
