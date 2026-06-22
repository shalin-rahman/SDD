class MenuItem {
  MenuItem({
    required this.code,
    required this.label,
    required this.entityCode,
    required this.module,
    this.icon,
    this.permission,
  });

  final String code;
  final String label;
  final String entityCode;
  final String module;
  final String? icon;
  final String? permission;

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      code: '${json['code']}',
      label: '${json['label']}',
      entityCode: '${json['entity_code']}',
      module: '${json['module'] ?? 'platform'}',
      icon: json['icon'] as String?,
      permission: json['permission'] as String?,
    );
  }
}

class ModuleNavGroup {
  ModuleNavGroup({required this.moduleCode, required this.moduleLabel, required this.items});

  final String moduleCode;
  final String moduleLabel;
  final List<MenuItem> items;
}

class PlatformNavLink {
  PlatformNavLink({required this.key, required this.label, required this.visible});

  final String key;
  final String label;
  final bool visible;
}

const _platformModuleKeys = {'workflow', 'payments', 'notifications', 'ai'};

bool hasPermission(List<String> permissions, String required) {
  if (permissions.contains('*.*') || permissions.contains(required)) {
    return true;
  }
  for (final entry in permissions) {
    if (entry.endsWith('.*')) {
      final prefix = entry.substring(0, entry.length - 1);
      if (required.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
}

String menuPermission(MenuItem menu) {
  if (menu.permission != null && menu.permission != 'read') {
    return menu.permission!;
  }
  return '${menu.entityCode.toLowerCase()}.read';
}

bool isModuleEnabled(String moduleCode, Map<String, dynamic>? modules) {
  final key = moduleCode.toLowerCase();
  if (!_platformModuleKeys.contains(key)) {
    return true;
  }
  final toggle = modules?[key];
  if (toggle is Map) {
    return toggle['enabled'] != false;
  }
  return true;
}

List<MenuItem> filterMenus(
  List<MenuItem> menus,
  List<String> userPermissions,
  Map<String, dynamic>? modules,
) {
  return menus.where((menu) {
    if (!isModuleEnabled(menu.module, modules)) {
      return false;
    }
    return hasPermission(userPermissions, menuPermission(menu));
  }).toList();
}

List<ModuleNavGroup> groupMenusByModule(List<MenuItem> menus) {
  final map = <String, List<MenuItem>>{};
  for (final menu in menus) {
    map.putIfAbsent(menu.module, () => []).add(menu);
  }
  final entries = map.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
  return entries
      .map(
        (entry) => ModuleNavGroup(
          moduleCode: entry.key,
          moduleLabel: formatModuleLabel(entry.key),
          items: [...entry.value]..sort((a, b) => a.label.compareTo(b.label)),
        ),
      )
      .toList();
}

String formatModuleLabel(String code) {
  if (code == 'platform') {
    return 'Platform';
  }
  return code
      .toLowerCase()
      .split('_')
      .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

List<PlatformNavLink> buildPlatformLinks(
  Map<String, dynamic>? modules,
  List<String> userPermissions,
) {
  final links = <PlatformNavLink>[
    PlatformNavLink(
      key: 'workflow',
      label: 'Workflow tasks',
      visible: (modules?['workflow'] as Map?)?['enabled'] != false,
    ),
    PlatformNavLink(key: 'reports', label: 'Reports', visible: true),
    PlatformNavLink(key: 'dashboards', label: 'Dashboards', visible: true),
    PlatformNavLink(
      key: 'notifications',
      label: 'Notifications',
      visible: (modules?['notifications'] as Map?)?['enabled'] != false,
    ),
    PlatformNavLink(key: 'account', label: 'Account', visible: true),
    PlatformNavLink(
      key: 'assistant',
      label: 'Assistant',
      visible: (modules?['ai'] as Map?)?['enabled'] == true,
    ),
  ];
  if (hasPermission(userPermissions, 'admin.users.read') ||
      hasPermission(userPermissions, 'admin.roles.read') ||
      hasPermission(userPermissions, 'admin.*')) {
    links.add(PlatformNavLink(key: 'admin-users', label: 'Admin users', visible: true));
    links.add(PlatformNavLink(key: 'admin-roles', label: 'Admin roles', visible: true));
    links.add(PlatformNavLink(key: 'admin-permissions', label: 'Permissions', visible: true));
  }
  if (hasPermission(userPermissions, 'admin.security.read') || hasPermission(userPermissions, 'admin.*')) {
    links.add(PlatformNavLink(key: 'admin-security', label: 'Security policies', visible: true));
  }
  if (hasPermission(userPermissions, 'admin.settings.read') || hasPermission(userPermissions, 'admin.*')) {
    links.add(PlatformNavLink(key: 'settings', label: 'Settings', visible: true));
  }
  return links.where((link) => link.visible).toList();
}

List<String> extractUserPermissions(Map<String, dynamic> me) {
  final perms = me['permissions'];
  if (perms is List) {
    return perms.map((item) => '$item').toList();
  }
  return ['*.*'];
}

Map<String, dynamic>? extractModuleToggles(Map<String, dynamic> config) {
  final modules = config['modules'];
  if (modules is Map) {
    return Map<String, dynamic>.from(modules);
  }
  return null;
}

/// API returns `tenants` as a map keyed by tenant id; tests may use a list.
List<Map<String, dynamic>> parseTenantEntries(Map<String, dynamic> payload) {
  final raw = payload['tenants'];
  if (raw is List) {
    return [
      for (final item in raw)
        if (item is Map) Map<String, dynamic>.from(item),
    ];
  }
  if (raw is Map) {
    return [
      for (final entry in raw.entries)
        {
          'id': entry.key,
          if (entry.value is Map) ...Map<String, dynamic>.from(entry.value as Map),
        },
    ];
  }
  return [];
}

class ShellNavEntryRef {
  const ShellNavEntryRef({
    required this.key,
    required this.label,
    this.groupLabel,
  });

  final String key;
  final String label;
  final String? groupLabel;
}

class RailNavSlot {
  const RailNavSlot.header(this.headerLabel) : key = null, label = null;

  const RailNavSlot.destination({required this.key, required this.label}) : headerLabel = null;

  final String? headerLabel;
  final String? key;
  final String? label;

  bool get isHeader => headerLabel != null;
}

List<RailNavSlot> buildRailNavSlots(List<ShellNavEntryRef> entries) {
  final slots = <RailNavSlot>[];
  String? currentGroup;
  for (final entry in entries) {
    if (entry.groupLabel != null && entry.groupLabel != currentGroup) {
      currentGroup = entry.groupLabel;
      slots.add(RailNavSlot.header(currentGroup!));
    }
    slots.add(RailNavSlot.destination(key: entry.key, label: entry.label));
  }
  return slots;
}

List<String> moduleHeaderLabels(List<RailNavSlot> slots) {
  return [
    for (final slot in slots)
      if (slot.isHeader) slot.headerLabel!,
  ];
}
