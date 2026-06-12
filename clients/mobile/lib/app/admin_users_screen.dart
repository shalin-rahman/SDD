import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';
import '../utils/permission_util.dart';
import '../widgets/detail_placeholder.dart';
import '../widgets/master_detail_layout.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _roles = [];
  String? _selectedId;
  bool _loading = true;
  String? _error;
  bool _detailOpen = false;
  bool _creating = false;
  bool _saving = false;

  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _tenantController = TextEditingController(text: 'default');
  final Set<String> _draftRoleCodes = {'viewer'};
  bool _draftActive = true;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _tenantController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final users = await widget.client.listAdminUsers();
      final roles = await widget.client.listAdminRoles();
      if (!mounted) return;
      setState(() {
        _users = users;
        _roles = roles;
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
    for (final user in _users) {
      if ('${user['id']}' == _selectedId) return user;
    }
    return null;
  }

  void _selectUser(Map<String, dynamic> user) {
    setState(() {
      _creating = false;
      _selectedId = '${user['id']}';
      _usernameController.text = '${user['username']}';
      _passwordController.clear();
      _tenantController.text = '${user['tenant_id']}';
      _draftRoleCodes
        ..clear()
        ..addAll(
          (user['roles'] as List? ?? []).map((r) => '${(r as Map)['code']}'),
        );
      _draftActive = user['active'] != false;
      _detailOpen = true;
    });
  }

  void _startCreate() {
    setState(() {
      _creating = true;
      _selectedId = null;
      _usernameController.clear();
      _passwordController.clear();
      _tenantController.text = 'default';
      _draftRoleCodes
        ..clear()
        ..add('viewer');
      _draftActive = true;
      _detailOpen = true;
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final roleCodes = _draftRoleCodes.toList();
      if (_selected != null) {
        await widget.client.updateAdminUser(
          '${_selected!['id']}',
          tenantId: _tenantController.text.trim(),
          active: _draftActive,
          roleCodes: roleCodes,
          password: _passwordController.text.trim().isEmpty ? null : _passwordController.text.trim(),
        );
      } else {
        await widget.client.createAdminUser(
          username: _usernameController.text.trim(),
          password: _passwordController.text.trim(),
          tenantId: _tenantController.text.trim(),
          roleCodes: roleCodes,
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

  Future<void> _deactivate() async {
    final selected = _selected;
    if (selected == null) return;
    await widget.client.deactivateAdminUser('${selected['id']}');
    await _reload();
    if (!mounted) return;
    setState(() {
      _selectedId = null;
      _detailOpen = false;
    });
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
            icon: const Icon(Icons.person_add),
            label: Text(EmcapLocale.t('admin.users.new')),
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
              itemCount: _users.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final user = _users[index];
                final id = '${user['id']}';
                final roles = (user['roles'] as List? ?? []).cast<Map<String, dynamic>>();
                return ListTile(
                  selected: _selectedId == id,
                  title: Text('${user['username']}'),
                  subtitle: Text('${user['tenant_id']} · ${formatRoleSummary(roles)}'),
                  trailing: user['active'] == false ? const Text('Inactive') : null,
                  onTap: () => _selectUser(user),
                );
              },
            ),
          ),
        ),
      ],
    );

    final selected = _selected;
    final detailPane = (!_creating && selected == null)
        ? DetailPlaceholder(message: EmcapLocale.t('admin.users.selectPlaceholder'))
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      selected != null ? 'Edit user' : 'Create user',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  if (selected != null && _draftActive)
                    TextButton(onPressed: _saving ? null : _deactivate, child: const Text('Deactivate')),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Save'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (selected == null)
                TextField(
                  controller: _usernameController,
                  decoration: const InputDecoration(labelText: 'Username', border: OutlineInputBorder()),
                ),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: selected != null ? 'New password (optional)' : 'Password',
                  border: const OutlineInputBorder(),
                ),
              ),
              TextField(
                controller: _tenantController,
                decoration: const InputDecoration(labelText: 'Tenant', border: OutlineInputBorder()),
              ),
              SwitchListTile(
                title: const Text('Account active'),
                value: _draftActive,
                onChanged: (v) => setState(() => _draftActive = v),
              ),
              Text('Roles', style: Theme.of(context).textTheme.titleSmall),
              ..._roles.map(
                (role) => CheckboxListTile(
                  title: Text('${role['name'] ?? role['code']}'),
                  subtitle: Text('${role['code']}'),
                  value: _draftRoleCodes.contains('${role['code']}'),
                  onChanged: (checked) {
                    setState(() {
                      final code = '${role['code']}';
                      if (checked == true) {
                        _draftRoleCodes.add(code);
                      } else {
                        _draftRoleCodes.remove(code);
                      }
                    });
                  },
                ),
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
