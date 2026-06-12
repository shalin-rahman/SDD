import 'package:emcap_mobile/utils/shell_nav_util.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('filterMenus hides disabled modules and checks permissions', () {
    final menus = [
      MenuItem(code: 'm1', label: 'Products', entityCode: 'PRODUCT', module: 'inventory', permission: 'product.read'),
      MenuItem(code: 'm2', label: 'Tasks', entityCode: 'TASK', module: 'workflow', permission: 'workflow.read'),
    ];
    final modules = {
      'workflow': {'enabled': false},
    };
    final filtered = filterMenus(menus, ['product.read'], modules);
    expect(filtered.map((m) => m.code), ['m1']);
  });

  test('groupMenusByModule groups and sorts', () {
    final groups = groupMenusByModule([
      MenuItem(code: 'b', label: 'B', entityCode: 'B', module: 'crm'),
      MenuItem(code: 'a', label: 'A', entityCode: 'A', module: 'inventory'),
    ]);
    expect(groups.map((g) => g.moduleCode), ['crm', 'inventory']);
    expect(groups.last.items.map((i) => i.code), ['a']);
  });

  test('buildPlatformLinks adds admin when permitted', () {
    final links = buildPlatformLinks({}, ['admin.settings.read']);
    expect(links.any((l) => l.key == 'settings'), isTrue);
    expect(links.any((l) => l.key == 'admin-users'), isFalse);
  });

  test('buildPlatformLinks adds admin users when admin.users.read', () {
    final links = buildPlatformLinks({}, ['admin.users.read']);
    expect(links.any((l) => l.key == 'admin-users'), isTrue);
  });

  test('buildRailNavSlots inserts module headers before entity destinations', () {
    final slots = buildRailNavSlots([
      const ShellNavEntryRef(key: 'workflow', label: 'Workflow'),
      const ShellNavEntryRef(key: 'entity:PRODUCT', label: 'Products', groupLabel: 'Inventory'),
      const ShellNavEntryRef(key: 'entity:WAREHOUSE', label: 'Warehouses', groupLabel: 'Inventory'),
      const ShellNavEntryRef(key: 'entity:CUSTOMER', label: 'Customers', groupLabel: 'Crm'),
    ]);
    expect(moduleHeaderLabels(slots), ['Inventory', 'Crm']);
    expect(slots[1].isHeader, isTrue);
    expect(slots[1].headerLabel, 'Inventory');
    expect(slots[2].key, 'entity:PRODUCT');
    expect(slots.where((slot) => slot.isHeader).length, 2);
  });
}
