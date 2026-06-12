import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../utils/permission_util.dart';

class AdminPermissionsScreen extends StatefulWidget {
  const AdminPermissionsScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<AdminPermissionsScreen> createState() => _AdminPermissionsScreenState();
}

class _AdminPermissionsScreenState extends State<AdminPermissionsScreen> {
  List<String> _permissions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final permissions = await widget.client.getPermissions();
      if (!mounted) return;
      setState(() {
        _permissions = permissions;
        _loading = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _error = err.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            TextButton(onPressed: _reload, child: const Text('Retry')),
          ],
        ),
      );
    }

    final groups = groupPermissions(_permissions);
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Text(
          'Permission catalog (${_permissions.length})',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        ...groups.map(
          (group) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ExpansionTile(
              title: Text(group.label),
              subtitle: Text('${group.permissions.length} permission(s)'),
              children: group.permissions
                  .map(
                    (permission) => ListTile(
                      dense: true,
                      title: Text(permission, style: const TextStyle(fontFamily: 'monospace')),
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }
}
