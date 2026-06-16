import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';
import '../theme/app_tokens.dart';
import 'emcap_badge.dart';

const _systemGridFields = {
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
};

class _FormFieldRow {
  _FormFieldRow({
    required this.name,
    required this.row,
    required this.col,
    required this.span,
  });

  final String name;
  int row;
  int col;
  int span;
}

class _GridColumnRow {
  _GridColumnRow({
    required this.field,
    required this.label,
    required this.sortable,
    required this.filterable,
    this.width,
  });

  final String field;
  final String label;
  bool sortable;
  bool filterable;
  int? width;
}

class LayoutEditorPanel extends StatefulWidget {
  const LayoutEditorPanel({super.key, required this.client});

  final EmcapClient client;

  @override
  State<LayoutEditorPanel> createState() => _LayoutEditorPanelState();
}

class _LayoutEditorPanelState extends State<LayoutEditorPanel> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<String> _entities = [];
  String _selectedEntity = 'PRODUCT';
  bool _loading = false;
  String _status = '';
  bool _hasOverride = false;
  List<_FormFieldRow> _formFields = [];
  List<_GridColumnRow> _gridColumns = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _init();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    try {
      final entities = await widget.client.listEntities();
      if (!mounted) return;
      setState(() {
        _entities = entities;
        if (entities.isNotEmpty && !entities.contains(_selectedEntity)) {
          _selectedEntity = entities.first;
        }
      });
      await _loadLayout();
    } catch (err) {
      if (!mounted) return;
      setState(() => _status = EmcapLocale.t('settings.layouts.loadFailed'));
    }
  }

  Future<void> _loadLayout() async {
    if (_selectedEntity.isEmpty) {
      return;
    }
    setState(() {
      _loading = true;
      _status = '';
    });
    try {
      final payload = await widget.client.getAdminLayoutMetadata(_selectedEntity);
      if (!mounted) return;
      final form = payload['form'] as Map? ?? {};
      final sections = List<Map<String, dynamic>>.from(form['sections'] as List? ?? []);
      Map<String, dynamic>? main;
      for (final section in sections) {
        if (section['code'] == 'main') {
          main = section;
          break;
        }
      }
      final fields = List<Map<String, dynamic>>.from(main?['fields'] as List? ?? []);
      final grid = payload['grid'] as Map? ?? {};
      final columns = List<Map<String, dynamic>>.from(grid['columns'] as List? ?? []);
      setState(() {
        _hasOverride = payload['has_override'] == true;
        _formFields = fields
            .map(
              (field) => _FormFieldRow(
                name: '${field['name']}',
                row: (field['row'] as num?)?.toInt() ?? 0,
                col: (field['col'] as num?)?.toInt() ?? 0,
                span: (field['span'] as num?)?.toInt() ?? 6,
              ),
            )
            .toList();
        _gridColumns = columns
            .where((column) => !_systemGridFields.contains('${column['field']}'))
            .map(
              (column) => _GridColumnRow(
                field: '${column['field']}',
                label: '${column['label'] ?? column['field']}',
                sortable: column['sortable'] == true,
                filterable: column['filterable'] == true,
                width: (column['width'] as num?)?.toInt(),
              ),
            )
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _status = EmcapLocale.t('settings.layouts.loadFailed');
        _loading = false;
      });
    }
  }

  void _moveColumn(int index, int delta) {
    final target = index + delta;
    if (target < 0 || target >= _gridColumns.length) {
      return;
    }
    setState(() {
      final item = _gridColumns.removeAt(index);
      _gridColumns.insert(target, item);
    });
  }

  Future<void> _saveLayout() async {
    setState(() => _status = '');
    try {
      await widget.client.putAdminLayoutOverride(_selectedEntity, {
        'form': {
          'sections': [
            {
              'code': 'main',
              'fields': _formFields
                  .map(
                    (field) => {
                      'name': field.name,
                      'row': field.row,
                      'col': field.col,
                      'span': field.span,
                    },
                  )
                  .toList(),
            },
          ],
        },
        'grid': {
          'columns': _gridColumns
              .map(
                (column) => {
                  'field': column.field,
                  'sortable': column.sortable,
                  'filterable': column.filterable,
                  if (column.width != null) 'width': column.width,
                },
              )
              .toList(),
        },
      });
      if (!mounted) return;
      setState(() {
        _hasOverride = true;
        _status = EmcapLocale.t('settings.layouts.saved');
      });
      await _loadLayout();
    } catch (_) {
      if (!mounted) return;
      setState(() => _status = EmcapLocale.t('settings.layouts.saveFailed'));
    }
  }

  Future<void> _resetLayout() async {
    setState(() => _status = '');
    try {
      await widget.client.deleteAdminLayoutOverride(_selectedEntity);
      if (!mounted) return;
      setState(() {
        _hasOverride = false;
        _status = EmcapLocale.t('settings.layouts.reset');
      });
      await _loadLayout();
    } catch (_) {
      if (!mounted) return;
      setState(() => _status = EmcapLocale.t('settings.layouts.resetFailed'));
    }
  }

  Widget _numberField({
    required String label,
    required int value,
    required ValueChanged<int> onChanged,
  }) {
    final controller = TextEditingController(text: '$value');
    return SizedBox(
      width: 72,
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder(), isDense: true),
        onChanged: (text) {
          final parsed = int.tryParse(text);
          if (parsed != null) {
            onChanged(parsed);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.emcapTokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(EmcapLocale.t('settings.layouts.subtitle'), style: Theme.of(context).textTheme.bodySmall),
        SizedBox(height: tokens.spaceSm),
        DropdownButtonFormField<String>(
          value: _entities.contains(_selectedEntity) ? _selectedEntity : (_entities.isNotEmpty ? _entities.first : null),
          decoration: InputDecoration(
            labelText: EmcapLocale.t('settings.layouts.entity'),
            border: const OutlineInputBorder(),
          ),
          items: _entities.map((entity) => DropdownMenuItem(value: entity, child: Text(entity))).toList(),
          onChanged: _loading
              ? null
              : (value) {
                  if (value == null) return;
                  setState(() => _selectedEntity = value);
                  _loadLayout();
                },
        ),
        if (_hasOverride) ...[
          SizedBox(height: tokens.spaceSm),
          EmcapBadge(label: EmcapLocale.t('settings.layouts.overrideBadge'), variant: EmcapBadgeVariant.off),
        ],
        if (_status.isNotEmpty) ...[
          SizedBox(height: tokens.spaceSm),
          Text(_status, style: Theme.of(context).textTheme.bodySmall),
        ],
        TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: EmcapLocale.t('settings.layouts.formTab')),
            Tab(text: EmcapLocale.t('settings.layouts.gridTab')),
          ],
        ),
        SizedBox(
          height: 280,
          child: TabBarView(
            controller: _tabController,
            children: [
              ListView(
                padding: EdgeInsets.all(tokens.spaceSm),
                children: [
                  for (final field in _formFields)
                    Padding(
                      padding: EdgeInsets.only(bottom: tokens.spaceSm),
                      child: Wrap(
                        spacing: tokens.spaceSm,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          SizedBox(width: 120, child: Text(field.name)),
                          _numberField(
                            label: EmcapLocale.t('settings.layouts.row'),
                            value: field.row,
                            onChanged: (value) => field.row = value,
                          ),
                          _numberField(
                            label: EmcapLocale.t('settings.layouts.col'),
                            value: field.col,
                            onChanged: (value) => field.col = value,
                          ),
                          _numberField(
                            label: EmcapLocale.t('settings.layouts.span'),
                            value: field.span,
                            onChanged: (value) => field.span = value,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              ListView(
                padding: EdgeInsets.all(tokens.spaceSm),
                children: [
                  for (var i = 0; i < _gridColumns.length; i++)
                    Padding(
                      padding: EdgeInsets.only(bottom: tokens.spaceSm),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${_gridColumns[i].label} (${_gridColumns[i].field})'),
                          Wrap(
                            spacing: tokens.spaceSm,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              FilterChip(
                                label: Text(EmcapLocale.t('settings.layouts.sortable')),
                                selected: _gridColumns[i].sortable,
                                onSelected: (selected) => setState(() => _gridColumns[i].sortable = selected),
                              ),
                              FilterChip(
                                label: Text(EmcapLocale.t('settings.layouts.filterable')),
                                selected: _gridColumns[i].filterable,
                                onSelected: (selected) => setState(() => _gridColumns[i].filterable = selected),
                              ),
                              _numberField(
                                label: EmcapLocale.t('settings.layouts.width'),
                                value: _gridColumns[i].width ?? 0,
                                onChanged: (value) => _gridColumns[i].width = value > 0 ? value : null,
                              ),
                              IconButton(
                                onPressed: i == 0 ? null : () => _moveColumn(i, -1),
                                icon: const Icon(Icons.arrow_upward),
                              ),
                              IconButton(
                                onPressed: i == _gridColumns.length - 1 ? null : () => _moveColumn(i, 1),
                                icon: const Icon(Icons.arrow_downward),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        Row(
          children: [
            FilledButton(
              onPressed: _loading ? null : _saveLayout,
              child: Text(EmcapLocale.t('settings.layouts.save')),
            ),
            SizedBox(width: tokens.spaceSm),
            OutlinedButton(
              onPressed: _loading || !_hasOverride ? null : _resetLayout,
              child: Text(EmcapLocale.t('settings.layouts.resetDefaults')),
            ),
          ],
        ),
      ],
    );
  }
}
