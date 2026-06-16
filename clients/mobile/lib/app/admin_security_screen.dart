import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';
import '../utils/shell_nav_util.dart';
import '../widgets/detail_placeholder.dart';
import '../widgets/master_detail_layout.dart';

class AdminSecurityScreen extends StatefulWidget {
  const AdminSecurityScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<AdminSecurityScreen> createState() => _AdminSecurityScreenState();
}

class _AdminSecurityScreenState extends State<AdminSecurityScreen> {
  List<Map<String, dynamic>> _entities = [];
  Map<String, dynamic> _rules = {};
  List<Map<String, dynamic>> _abacPolicies = [];
  List<String> _allPermissions = [];
  bool _canEditSecurity = false;
  String? _selectedCode;
  bool _loading = true;
  String? _error;
  String? _abacError;

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
      final payload = await widget.client.getAdminSecurityPolicies();
      final abac = await widget.client.getAdminAbacPolicies();
      final permissions = await widget.client.getPermissions();
      var canEdit = false;
      try {
        final me = await widget.client.getMe();
        final userPermissions = extractUserPermissions(me);
        canEdit = hasPermission(userPermissions, 'admin.security.write') ||
            hasPermission(userPermissions, 'admin.*') ||
            hasPermission(userPermissions, '*.*');
      } catch (_) {
        canEdit = false;
      }
      if (!mounted) return;
      final entities = List<Map<String, dynamic>>.from(payload['entities'] as List? ?? []);
      setState(() {
        _entities = entities;
        _rules = Map<String, dynamic>.from(payload['rules'] as Map? ?? {});
        _abacPolicies = abac;
        _allPermissions = permissions;
        _canEditSecurity = canEdit;
        _selectedCode = _selectedCode ?? (entities.isNotEmpty ? '${entities.first['code']}' : null);
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

  Future<void> _editAbacPolicy(int index) async {
    final policy = Map<String, dynamic>.from(_abacPolicies[index]);
    final permission = TextEditingController(text: '${policy['permission'] ?? ''}');
    final effect = TextEditingController(text: '${policy['effect'] ?? ''}');
    final attribute = TextEditingController(text: '${policy['attribute'] ?? ''}');
    final operator = TextEditingController(text: '${policy['operator'] ?? ''}');
    final value = TextEditingController(text: '${policy['value'] ?? ''}');
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(EmcapLocale.t('admin.security.abacTitle')),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: permission,
                decoration: InputDecoration(labelText: EmcapLocale.t('admin.security.colPermission')),
              ),
              TextField(
                controller: effect,
                decoration: InputDecoration(labelText: EmcapLocale.t('admin.security.colEffect')),
              ),
              TextField(
                controller: attribute,
                decoration: InputDecoration(labelText: EmcapLocale.t('admin.security.colAttribute')),
              ),
              TextField(
                controller: operator,
                decoration: InputDecoration(labelText: EmcapLocale.t('admin.security.colOperator')),
              ),
              TextField(
                controller: value,
                decoration: InputDecoration(labelText: EmcapLocale.t('admin.security.colValue')),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(EmcapLocale.t('common.cancel'))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text(EmcapLocale.t('common.save'))),
        ],
      ),
    );
    if (saved != true || !mounted) {
      permission.dispose();
      effect.dispose();
      attribute.dispose();
      operator.dispose();
      value.dispose();
      return;
    }
    final updated = {
      'permission': permission.text,
      'effect': effect.text,
      'attribute': attribute.text,
      'operator': operator.text,
      'value': value.text,
    };
    permission.dispose();
    effect.dispose();
    attribute.dispose();
    operator.dispose();
    value.dispose();
    setState(() => _abacPolicies[index] = updated);
  }

  Future<void> _editFieldAccess(String fieldName, List<String> readRoles) async {
    if (!_canEditSecurity || _selectedCode == null) {
      return;
    }
    final draft = {...readRoles};
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('${EmcapLocale.t('admin.security.editField')}: $fieldName'),
          content: SizedBox(
            width: double.maxFinite,
            height: 320,
            child: _allPermissions.isEmpty
                ? Text(EmcapLocale.t('admin.security.selectPlaceholder'))
                : ListView(
                    children: [
                      for (final permission in _allPermissions)
                        CheckboxListTile(
                          value: draft.contains(permission),
                          title: Text(permission, style: Theme.of(context).textTheme.bodySmall),
                          onChanged: (checked) {
                            setDialogState(() {
                              if (checked == true) {
                                draft.add(permission);
                              } else {
                                draft.remove(permission);
                              }
                            });
                          },
                        ),
                    ],
                  ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(EmcapLocale.t('common.cancel'))),
            TextButton(onPressed: () => Navigator.pop(context, true), child: Text(EmcapLocale.t('admin.security.saveFieldAccess'))),
          ],
        ),
      ),
    );
    if (saved != true || !mounted) {
      return;
    }
    try {
      await widget.client.updateAdminFieldAccess(
        entityCode: _selectedCode!,
        fieldName: fieldName,
        readRoles: draft.toList(),
      );
      if (!mounted) return;
      await _reload();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(EmcapLocale.t('admin.security.fieldAccessSaved'))),
      );
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(EmcapLocale.t('admin.security.fieldAccessSaveFailed'))),
      );
    }
  }

  Future<void> _saveAbac() async {
    setState(() => _abacError = null);
    try {
      final saved = await widget.client.updateAdminAbacPolicies(_abacPolicies);
      if (!mounted) return;
      setState(() => _abacPolicies = saved);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(EmcapLocale.t('admin.security.abacSaved'))),
      );
    } catch (err) {
      if (!mounted) return;
      setState(() => _abacError = err.toString());
    }
  }

  Map<String, dynamic>? get _selectedEntity {
    if (_selectedCode == null) return null;
    for (final entity in _entities) {
      if ('${entity['code']}' == _selectedCode) return entity;
    }
    return null;
  }

  String _accessLabel(String access) {
    return access == 'restricted'
        ? EmcapLocale.t('admin.security.accessRestricted')
        : EmcapLocale.t('admin.security.accessOpen');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(child: Text(_error!));
    }

    final entity = _selectedEntity;
    final listPane = ListView.builder(
      itemCount: _entities.length,
      itemBuilder: (context, index) {
        final item = _entities[index];
        final code = '${item['code']}';
        return ListTile(
          title: Text(code),
          subtitle: Text('${item['row_access']}'),
          selected: code == _selectedCode,
          onTap: () => setState(() => _selectedCode = code),
        );
      },
    );

    final detailPane = entity == null
        ? DetailPlaceholder(message: EmcapLocale.t('admin.security.selectPlaceholder'))
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(entity['code'] as String, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text('${EmcapLocale.t('admin.security.readPermission')}: ${entity['read_permission']}'),
              Text('${EmcapLocale.t('admin.security.rowAccess')}: ${entity['row_access']}'),
              const SizedBox(height: 16),
              DataTable(
                columns: [
                  DataColumn(label: Text(EmcapLocale.t('admin.security.field'))),
                  DataColumn(label: Text(EmcapLocale.t('admin.security.access'))),
                  DataColumn(label: Text(EmcapLocale.t('admin.security.requiredPermissions'))),
                ],
                rows: [
                  for (final field in List<Map<String, dynamic>>.from(entity['fields'] as List? ?? []))
                    DataRow(
                      onSelectChanged: _canEditSecurity
                          ? (_) => _editFieldAccess(
                                '${field['name']}',
                                List<String>.from(field['read_roles'] as List? ?? []),
                              )
                          : null,
                      cells: [
                        DataCell(Text('${field['name']}')),
                        DataCell(Text(_accessLabel('${field['access']}'))),
                        DataCell(Text((field['read_roles'] as List?)?.join(', ') ?? '—')),
                      ],
                    ),
                ],
              ),
              if (_rules['row_access'] != null) ...[
                const SizedBox(height: 16),
                Text(EmcapLocale.t('admin.security.rulesTitle'), style: Theme.of(context).textTheme.titleSmall),
                Text('${_rules['row_access']}'),
                Text('${_rules['field_access']}'),
              ],
            ],
          );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(EmcapLocale.t('admin.security.title'), style: Theme.of(context).textTheme.titleLarge),
              Text(EmcapLocale.t('admin.security.subtitleEditor')),
            ],
          ),
        ),
        Expanded(
          flex: 2,
          child: MasterDetailLayout(
            listPane: listPane,
            detailPane: detailPane,
            detailOpen: entity != null,
          ),
        ),
        Expanded(
          flex: 1,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(EmcapLocale.t('admin.security.abacTitle'), style: Theme.of(context).textTheme.titleMedium),
              Text(EmcapLocale.t('admin.security.abacHint'), style: Theme.of(context).textTheme.bodySmall),
              if (_abacError != null) Text(_abacError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: [
                    DataColumn(label: Text(EmcapLocale.t('admin.security.colPermission'))),
                    DataColumn(label: Text(EmcapLocale.t('admin.security.colAttribute'))),
                    DataColumn(label: Text(EmcapLocale.t('admin.security.colValue'))),
                  ],
                  rows: _abacPolicies.asMap().entries.map((entry) {
                    final index = entry.key;
                    final policy = entry.value;
                    return DataRow(
                      onSelectChanged: (_) => _editAbacPolicy(index),
                      cells: [
                        DataCell(Text('${policy['permission'] ?? ''}')),
                        DataCell(Text('${policy['attribute'] ?? ''}')),
                        DataCell(Text('${policy['value'] ?? ''}')),
                      ],
                    );
                  }).toList(),
                ),
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _abacPolicies = [
                          ..._abacPolicies,
                          {
                            'permission': '',
                            'effect': 'allow',
                            'attribute': 'tenant_id',
                            'operator': 'equals',
                            'value': r'$user.tenant_id',
                          },
                        ];
                      });
                    },
                    child: Text(EmcapLocale.t('admin.security.addPolicy')),
                  ),
                  TextButton(onPressed: _saveAbac, child: Text(EmcapLocale.t('admin.security.saveAbac'))),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
