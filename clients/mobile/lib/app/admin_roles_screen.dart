import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';
import '../widgets/detail_placeholder.dart';
import '../widgets/master_detail_layout.dart';
import '../widgets/permission_picker.dart';

class AdminRolesScreen extends StatefulWidget {
  const AdminRolesScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<AdminRolesScreen> createState() => _AdminRolesScreenState();
}

class _AdminRolesScreenState extends State<AdminRolesScreen> {
  List<Map<String, dynamic>> _roles = [];
  List<String> _allPermissions = [];
  String? _selectedId;
  bool _loading = true;
  String? _error;
  bool _detailOpen = false;
  bool _creating = false;
  bool _saving = false;

  final _codeController = TextEditingController();
  final _nameController = TextEditingController();
  List<String> _draftPermissions = ['*.read'];

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _codeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final roles = await widget.client.listAdminRoles();
      final permissions = await widget.client.getPermissions();
      if (!mounted) return;
      setState(() {
        _roles = roles;
        _allPermissions = permissions;
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

  Map<String, dynamic>? get _selected {
    if (_selectedId == null) return null;
    for (final role in _roles) {
      if ('${role['id']}' == _selectedId) return role;
    }
    return null;
  }

  void _selectRole(Map<String, dynamic> role) {
    setState(() {
      _creating = false;
      _selectedId = '${role['id']}';
      _codeController.text = '${role['code']}';
      _nameController.text = '${role['name'] ?? role['code']}';
      _draftPermissions = (role['permissions'] as List? ?? []).map((p) => '$p').toList();
      _detailOpen = true;
    });
  }

  void _startCreate() {
    setState(() {
      _creating = true;
      _selectedId = null;
      _codeController.clear();
      _nameController.clear();
      _draftPermissions = ['*.read'];
      _detailOpen = true;
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      if (_selected != null) {
        await widget.client.updateAdminRole(
          '${_selected!['id']}',
          name: _nameController.text.trim(),
          permissions: _draftPermissions,
        );
      } else {
        await widget.client.createAdminRole(
          code: _codeController.text.trim(),
          name: _nameController.text.trim(),
          permissions: _draftPermissions,
        );
      }
      await _reload();
      if (!mounted) return;
      setState(() {
        _creating = false;
        _detailOpen = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() => _error = err.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _permissionSummary(Map<String, dynamic> role) {
    final count = (role['permissions'] as List? ?? []).length;
    return '$count ${EmcapLocale.t('admin.permissions.permissionCountSuffix')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final listPane = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            onPressed: _startCreate,
            icon: const Icon(Icons.add),
            label: Text(EmcapLocale.t('admin.roles.new')),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 8),
        Expanded(
          child: Card(
            margin: EdgeInsets.zero,
            child: ListView.separated(
              itemCount: _roles.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final role = _roles[index];
                final id = '${role['id']}';
                return ListTile(
                  selected: _selectedId == id,
                  title: Text('${role['name'] ?? role['code']}'),
                  subtitle: Text('${role['code']} · ${_permissionSummary(role)}'),
                  onTap: () => _selectRole(role),
                );
              },
            ),
          ),
        ),
      ],
    );

    final selected = _selected;
    final detailPane = (!_creating && selected == null)
        ? DetailPlaceholder(message: EmcapLocale.t('admin.roles.selectPlaceholder'))
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      selected != null
                          ? EmcapLocale.t('admin.roles.editTitle')
                          : EmcapLocale.t('admin.roles.createTitle'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(EmcapLocale.t('admin.roles.save')),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (selected == null)
                TextField(
                  controller: _codeController,
                  decoration: InputDecoration(
                    labelText: EmcapLocale.t('admin.roles.codeLabel'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: EmcapLocale.t('admin.roles.nameLabel'),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Text(EmcapLocale.t('admin.roles.permissionsTitle'), style: Theme.of(context).textTheme.titleSmall),
              PermissionPicker(
                permissions: _allPermissions,
                selected: _draftPermissions,
                onChanged: (next) => setState(() => _draftPermissions = next),
              ),
            ],
          );

    return MasterDetailLayout(
      listPane: listPane,
      detailPane: detailPane,
      detailOpen: _detailOpen,
      onBack: () => setState(() {
        _detailOpen = false;
        _creating = false;
        _selectedId = null;
      }),
    );
  }
}
