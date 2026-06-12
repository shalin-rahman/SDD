class PermissionGroup {
  PermissionGroup({required this.module, required this.label, required this.permissions});

  final String module;
  final String label;
  final List<String> permissions;
}

String permissionModule(String permission) {
  if (permission == '*.*' || permission.endsWith('.*')) {
    return 'platform';
  }
  final dot = permission.indexOf('.');
  return dot > 0 ? permission.substring(0, dot) : 'platform';
}

List<PermissionGroup> groupPermissions(List<String> permissions) {
  final map = <String, List<String>>{};
  for (final permission in permissions) {
    final module = permissionModule(permission);
    map.putIfAbsent(module, () => []).add(permission);
  }
  final entries = map.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
  return entries
      .map(
        (entry) => PermissionGroup(
          module: entry.key,
          label: _formatModuleLabel(entry.key),
          permissions: [...entry.value]..sort(),
        ),
      )
      .toList();
}

bool hasSelectedPermission(List<String> selected, String permission) {
  if (selected.contains(permission) || selected.contains('*.*')) {
    return true;
  }
  final module = permissionModule(permission);
  if (selected.contains('$module.*')) {
    return true;
  }
  if (selected.contains('admin.*') && module == 'admin') {
    return true;
  }
  for (final entry in selected) {
    if (entry.endsWith('.*')) {
      final prefix = entry.substring(0, entry.length - 1);
      if (permission.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
}

List<String> togglePermission(List<String> selected, String permission, bool enabled) {
  final next = selected.where((entry) => !entry.endsWith('.*') || entry == permission).toSet();
  if (enabled) {
    next.add(permission);
  } else {
    next.remove(permission);
  }
  return next.toList()..sort();
}

List<String> toggleWildcard(List<String> selected, String wildcard, bool enabled) {
  final module = wildcard.replaceAll('.*', '');
  final withoutModule = selected
      .where((entry) => entry != wildcard && permissionModule(entry) != module)
      .toList();
  if (enabled) {
    return [...withoutModule, wildcard]..sort();
  }
  return withoutModule..sort();
}

String formatRoleSummary(List<Map<String, dynamic>> roles) {
  if (roles.isEmpty) {
    return '—';
  }
  return roles.map((role) => '${role['name'] ?? role['code']}').join(', ');
}

String _formatModuleLabel(String code) {
  if (code == 'platform') {
    return 'Platform';
  }
  return code
      .split('_')
      .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}
