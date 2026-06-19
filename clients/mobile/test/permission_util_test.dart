import 'package:emcap_mobile/utils/permission_util.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('groupPermissions sorts by module', () {
    final groups = groupPermissions(['product.read', 'admin.users.read', 'customer.read']);
    expect(groups.map((g) => g.module), ['admin', 'customer', 'product']);
  });

  test('hasSelectedPermission respects wildcards', () {
    expect(hasSelectedPermission(['admin.*'], 'admin.users.read'), isTrue);
    expect(hasSelectedPermission(['product.read'], 'product.write'), isFalse);
  });

  test('togglePermission adds and removes entries', () {
    expect(togglePermission(['product.read'], 'product.write', true), ['product.read', 'product.write']);
    expect(togglePermission(['product.read', 'product.write'], 'product.write', false), ['product.read']);
  });

  test('toggleWildcard replaces module permissions', () {
    final enabled = toggleWildcard(['product.read'], 'product.*', true);
    expect(enabled, ['product.*']);
    final disabled = toggleWildcard(['product.*', 'admin.read'], 'product.*', false);
    expect(disabled, ['admin.read']);
  });

  test('formatRoleSummary joins role names', () {
    expect(
      formatRoleSummary([
        {'code': 'admin', 'name': 'Administrator'},
        {'code': 'viewer', 'name': 'Viewer'},
      ]),
      'Administrator, Viewer',
    );
    expect(formatRoleSummary([]), '—');
    expect(formatRoleSummary([{'code': 'viewer'}]), 'viewer');
  });

  test('permissionModule maps wildcards and bare codes to platform', () {
    final groups = groupPermissions(['*.*', 'inventory.read', 'bare']);
    expect(groups.any((g) => g.module == 'platform'), isTrue);
    expect(hasSelectedPermission(['*.*'], 'anything.here'), isTrue);
    expect(hasSelectedPermission(['inventory.*'], 'inventory.write'), isTrue);
  });

  test('hasSelectedPermission matches prefix wildcard entries', () {
    expect(hasSelectedPermission(['product.*'], 'product.write'), isTrue);
    expect(hasSelectedPermission(['product.*'], 'inventory.read'), isFalse);
  });

  test('permissionModule returns platform for wildcard permissions', () {
    expect(permissionModule('*.*'), 'platform');
    expect(permissionModule('inventory.*'), 'platform');
  });
}
