import 'package:flutter/material.dart';

import '../utils/permission_util.dart';

class PermissionPicker extends StatelessWidget {
  const PermissionPicker({
    super.key,
    required this.permissions,
    required this.selected,
    required this.onChanged,
  });

  final List<String> permissions;
  final List<String> selected;
  final ValueChanged<List<String>> onChanged;

  @override
  Widget build(BuildContext context) {
    final groups = groupPermissions(permissions);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: groups.map((group) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ExpansionTile(
            title: Text(group.label),
            subtitle: Text('${group.permissions.length} permission(s)'),
            children: [
              CheckboxListTile(
                title: Text('All ${group.label} (${group.module}.*)'),
                value: selected.contains('${group.module}.*'),
                onChanged: (checked) {
                  onChanged(toggleWildcard(selected, '${group.module}.*', checked ?? false));
                },
              ),
              ...group.permissions.map(
                (permission) => CheckboxListTile(
                  title: Text(permission, style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
                  value: hasSelectedPermission(selected, permission),
                  onChanged: (checked) {
                    onChanged(togglePermission(selected, permission, checked ?? false));
                  },
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
