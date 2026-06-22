import 'package:emcap_mobile/utils/shell_nav_util.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('menuPermission uses explicit permission when not read', () {
    final menu = MenuItem(
      code: 'admin',
      label: 'Admin',
      entityCode: 'USER',
      module: 'admin',
      permission: 'admin.users.write',
    );
    expect(menuPermission(menu), 'admin.users.write');
  });

  test('extractUserPermissions reads list or defaults to wildcard', () {
    expect(extractUserPermissions({'permissions': ['product.read']}), ['product.read']);
    expect(extractUserPermissions({}), ['*.*']);
  });

  test('extractModuleToggles accepts any map shape', () {
    expect(extractModuleToggles({'modules': {'workflow': {'enabled': false}}}), isNotNull);
    expect(extractModuleToggles({'modules': 'bad'}), isNull);
  });

  test('parseTenantEntries supports API map and test list shapes', () {
    final fromMap = parseTenantEntries({
      'tenants': {
        'default': {'domain': 'localhost', 'primary_color': '#1A56DB'},
      },
    });
    expect(fromMap, hasLength(1));
    expect(fromMap.first['id'], 'default');
    expect(fromMap.first['domain'], 'localhost');

    final fromList = parseTenantEntries({
      'tenants': [
        {'id': 'default', 'name': 'Default'},
      ],
    });
    expect(fromList, hasLength(1));
    expect(fromList.first['name'], 'Default');
  });

  test('buildPlatformLinks includes admin security and assistant toggles', () {
    final modules = {
      'ai': {'enabled': true},
      'workflow': {'enabled': true},
    };
    final adminLinks = buildPlatformLinks(modules, ['admin.security.read']);
    expect(adminLinks.any((l) => l.key == 'admin-security'), isTrue);
    expect(adminLinks.any((l) => l.key == 'assistant'), isTrue);

    final roleLinks = buildPlatformLinks(modules, ['admin.roles.read']);
    expect(roleLinks.any((l) => l.key == 'admin-roles'), isTrue);
  });

  test('hasPermission matches wildcard prefix', () {
    expect(hasPermission(['inventory.*'], 'inventory.read'), isTrue);
    expect(hasPermission(['product.read'], 'inventory.read'), isFalse);
  });

  test('formatModuleLabel title-cases module codes', () {
    expect(formatModuleLabel('inventory_mgmt'), 'Inventory Mgmt');
    expect(formatModuleLabel('platform'), 'Platform');
  });
}
