import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/emcap_client.dart';
import '../metadata_contract.dart';
import '../services/i18n_service.dart';
import '../widgets/detail_placeholder.dart';
import '../widgets/master_detail_layout.dart';

class EntityScreen extends StatefulWidget {
  const EntityScreen({super.key, required this.client, required this.entityCode, required this.title});

  final EmcapClient client;
  final String entityCode;
  final String title;

  @override
  State<EntityScreen> createState() => _EntityScreenState();
}

class _EntityScreenState extends State<EntityScreen> {
  late Future<_EntityViewModel> _future;
  final Map<String, TextEditingController> _controllers = {};
  final _noteController = TextEditingController();
  bool _creating = false;
  bool _creatingNew = false;
  bool _detailOpen = false;
  String? _createError;
  String? _selectedRecordId;
  List<Map<String, dynamic>> _selectedNotes = [];
  List<Map<String, dynamic>> _selectedDocuments = [];
  List<Map<String, dynamic>> _selectedAudit = [];
  final _docFilename = TextEditingController(text: 'spec.txt');
  final _docContent = TextEditingController(text: 'uploaded from mobile');
  bool _loadingDetail = false;
  bool _realtimeStarted = false;
  final _searchController = TextEditingController();
  String? _editingId;
  int _page = 1;
  static const _pageSize = 10;
  String? _sortField;
  bool _sortAsc = true;
  final Map<String, String> _filters = {};
  String? _groupField;
  final Map<String, bool> _checkboxValues = {};

  @override
  void initState() {
    super.initState();
    EmcapLocale.locale.addListener(_onLocaleChanged);
    _future = _load();
  }

  void _onLocaleChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    EmcapLocale.locale.removeListener(_onLocaleChanged);
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _noteController.dispose();
    _docFilename.dispose();
    _docContent.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<_EntityViewModel> _load() async {
    final formJson = await widget.client.getFormMetadata(widget.entityCode);
    final gridJson = await widget.client.getGridMetadata(widget.entityCode);
    final records = await widget.client.listRecords(
      widget.entityCode,
      q: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
    );
    final snapshot = await widget.client.syncSnapshot(widget.entityCode);
    final form = FormMetadata.fromJson(formJson);
    final grid = GridMetadata.fromJson(gridJson);
    final exportMap = gridJson['export'] as Map? ?? {};
    final exportCsv = exportMap['csv'] == true;
    final exportExcel = exportMap['excel'] == true;
    final exportPdf = exportMap['pdf'] == true;
    final syncVersion = snapshot['sync_version'] as String? ?? '';
    var changeCount = 0;
    if (grid.offline && syncVersion.isNotEmpty) {
      final changes = await widget.client.syncChanges(widget.entityCode, syncVersion);
      changeCount = changes['count'] as int? ?? 0;
    }
    _syncControllers(DynamicFormRenderer(form, locale: EmcapLocale.locale.value.languageCode).fieldNames());
    if (grid.realtime && !_realtimeStarted) {
      _realtimeStarted = true;
      widget.client.subscribeRecordsStream(widget.entityCode, () {
        if (mounted) _reload();
      });
    }
    return _EntityViewModel(
      form: form,
      grid: grid,
      records: records,
      syncVersion: syncVersion,
      changeCount: changeCount,
      exportCsv: exportCsv,
      exportExcel: exportExcel,
      exportPdf: exportPdf,
    );
  }

  String _exportText(DynamicGridRenderer gridRenderer, List<Map<String, dynamic>> records) {
    final cols = gridRenderer.columnFields();
    final sb = StringBuffer(cols.join(','));
    for (final record in records) {
      sb.writeln();
      sb.write(cols.map((c) => '${record[c] ?? ''}').join(','));
    }
    return sb.toString();
  }

  Future<void> _copyExport(String text, String label) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label copied to clipboard')));
  }

  Future<void> _reload() async {
    setState(() {
      _createError = null;
      _future = _load();
    });
  }

  Future<void> _saveRecord() async {
    setState(() {
      _creating = true;
      _createError = null;
    });
    try {
      final draft = _collectDraft();
      final formJson = await widget.client.getFormMetadata(widget.entityCode);
      final formRenderer = DynamicFormRenderer(FormMetadata.fromJson(formJson), locale: EmcapLocale.locale.value.languageCode);
      for (final name in formRenderer.fieldNames()) {
        if (!formRenderer.isVisible(name, draft)) continue;
        final meta = fieldMetadata(formRenderer.metadata, name);
        if (meta == null) continue;
        final value = meta['field_type'] == 'checkbox' ? _checkboxValues[name] : _controllers[name]?.text;
        final err = formRenderer.validateField(meta, value);
        if (err != null) throw Exception(err);
      }
      if (_editingId != null) {
        await widget.client.updateRecord(widget.entityCode, _editingId!, draft);
        _editingId = null;
      } else {
        final created = await widget.client.createRecord(widget.entityCode, draft);
        final note = _noteController.text.trim();
        if (note.isNotEmpty) {
          await widget.client.addNote(
            widget.entityCode,
            created['id'] as String,
            note,
          );
        }
        _noteController.clear();
        setState(() {
          _selectedRecordId = '${created['id']}';
          _detailOpen = true;
        });
      }
      _clearControllers();
      setState(() {
        _creatingNew = false;
        _editingId = null;
      });
      await _reload();
    } catch (err) {
      if (!mounted) return;
      setState(() => _createError = err.toString());
    } finally {
      if (mounted) {
        setState(() => _creating = false);
      }
    }
  }

  void _syncControllers(List<String> fieldNames) {
    for (final name in _controllers.keys.toList()) {
      if (!fieldNames.contains(name)) {
        _controllers.remove(name)?.dispose();
      }
    }
    for (final name in fieldNames) {
      _controllers.putIfAbsent(name, TextEditingController.new);
    }
  }

  Map<String, dynamic> _collectDraft() {
    return {
      for (final entry in _controllers.entries)
        entry.key: _checkboxValues.containsKey(entry.key)
            ? _checkboxValues[entry.key]
            : entry.value.text,
    };
  }

  Widget _fieldInput(DynamicFormRenderer renderer, String name) {
    final meta = fieldMetadata(renderer.metadata, name);
    final type = meta?['field_type'] as String? ?? 'text';
    if (type == 'checkbox') {
      return CheckboxListTile(
        title: Text(renderer.label(name)),
        value: _checkboxValues[name] ?? false,
        onChanged: (v) => setState(() => _checkboxValues[name] = v ?? false),
      );
    }
    return TextField(
      controller: _controllers[name],
      decoration: InputDecoration(labelText: renderer.label(name)),
      keyboardType: type == 'number' ? TextInputType.number : TextInputType.text,
    );
  }

  void _clearControllers() {
    for (final controller in _controllers.values) {
      controller.clear();
    }
  }

  Future<void> _startEdit(String recordId) async {
    final record = await widget.client.getRecord(widget.entityCode, recordId);
    for (final entry in _controllers.entries) {
      entry.value.text = '${record[entry.key] ?? ''}';
    }
    setState(() {
      _editingId = recordId;
      _creatingNew = false;
      _detailOpen = true;
    });
  }

  Future<void> _deleteRecord(String recordId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(EmcapLocale.t('record.deleteConfirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(EmcapLocale.t('common.cancel'))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(EmcapLocale.t('common.delete'))),
        ],
      ),
    );
    if (ok != true) return;
    await widget.client.deleteRecord(widget.entityCode, recordId);
    setState(() {
      _selectedRecordId = null;
      _editingId = null;
      _detailOpen = false;
    });
    await _reload();
  }

  Future<void> _selectRecord(String recordId) async {
    setState(() {
      _selectedRecordId = recordId;
      _creatingNew = false;
      _detailOpen = true;
      _loadingDetail = true;
      _selectedNotes = [];
      _selectedDocuments = [];
      _selectedAudit = [];
      _editingId = null;
    });
    try {
      final notes = await widget.client.listNotes(widget.entityCode, recordId);
      final documents = await widget.client.listDocuments(widget.entityCode, recordId);
      final auditAll = await widget.client.listAudit(widget.entityCode);
      final audit = auditAll.where((e) => '${e['record_id']}' == recordId).toList();
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() {
        _selectedNotes = notes;
        _selectedDocuments = documents;
        _selectedAudit = audit;
      });
    } catch (err) {
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() => _createError = err.toString());
    } finally {
      if (mounted && _selectedRecordId == recordId) {
        setState(() => _loadingDetail = false);
      }
    }
  }

  void _startCreate() {
    setState(() {
      _creatingNew = true;
      _selectedRecordId = null;
      _editingId = null;
      _detailOpen = true;
      _clearControllers();
      _noteController.clear();
    });
  }

  void _closeDetail() {
    setState(() {
      _detailOpen = false;
      _creatingNew = false;
      _editingId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_EntityViewModel>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Failed to load: ${snapshot.error}'));
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final model = snapshot.data!;
        if (!model.form.isValid || !model.grid.isValid) {
          return Center(child: Text(EmcapLocale.t('entity.invalidMetadata')));
        }
        final formRenderer = DynamicFormRenderer(model.form, locale: EmcapLocale.locale.value.languageCode);
        final gridRenderer = DynamicGridRenderer(model.grid, locale: EmcapLocale.locale.value.languageCode);
        final fieldNames = formRenderer.fieldNames();
        final draft = _collectDraft();
        final visibleFields = fieldNames.where((n) => formRenderer.isVisible(n, draft)).toList();
        var working = gridRenderer.filterRecords(model.records, _filters);
        working = gridRenderer.sortRecords(working, _sortField, _sortAsc);
        final totalPages = (working.length / _pageSize).ceil().clamp(1, 9999);
        final pageRecords = working.skip((_page - 1) * _pageSize).take(_pageSize).toList();
        final groups = gridRenderer.groupRecords(pageRecords, _groupField);

        final listPane = _buildListPane(
          model: model,
          gridRenderer: gridRenderer,
          groups: groups,
          totalPages: totalPages,
          working: working,
        );

        final detailPane = (_selectedRecordId == null && !_creatingNew)
            ? DetailPlaceholder(message: EmcapLocale.t('entity.selectPlaceholder'))
            : _buildDetailPane(formRenderer: formRenderer, visibleFields: visibleFields);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                if (_detailOpen)
                  TextButton.icon(
                    onPressed: _closeDetail,
                    icon: const Icon(Icons.arrow_back),
                    label: const Text('Back'),
                  ),
                Expanded(
                  child: Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
                ),
                FilledButton(onPressed: _startCreate, child: Text(EmcapLocale.t('entity.new'))),
              ],
            ),
            const SizedBox(height: 8),
            Expanded(
              child: MasterDetailLayout(
                listPane: listPane,
                detailPane: detailPane,
                detailOpen: _detailOpen,
                onBack: _closeDetail,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildListPane({
    required _EntityViewModel model,
    required DynamicGridRenderer gridRenderer,
    required List<MapEntry<String, List<Map<String, dynamic>>>> groups,
    required int totalPages,
    required List<Map<String, dynamic>> working,
  }) {
    return ListView(
      padding: const EdgeInsets.all(8),
      children: [
        TextField(
          controller: _searchController,
          decoration: InputDecoration(labelText: EmcapLocale.t('entity.search'), border: const OutlineInputBorder()),
          onSubmitted: (_) => _reload(),
        ),
        Row(
          children: [
            TextButton(onPressed: _page > 1 ? () => setState(() => _page--) : null, child: Text(EmcapLocale.t('grid.prev'))),
            Text('${EmcapLocale.t('grid.page')} $_page / $totalPages'),
            TextButton(
              onPressed: _page < totalPages ? () => setState(() => _page++) : null,
              child: Text(EmcapLocale.t('grid.next')),
            ),
          ],
        ),
        Text(
          model.changeCount > 0
              ? '${EmcapLocale.t('grid.offlinePrefix')} · ${model.changeCount} ${EmcapLocale.t('grid.changes')} · ${EmcapLocale.t('grid.snapshot')} ${model.syncVersion}'
              : '${EmcapLocale.t('grid.offlineStatus')}: ${model.syncVersion}',
        ),
        Wrap(
          spacing: 8,
          children: [
            if (model.exportCsv)
              TextButton(
                onPressed: () => _copyExport(_exportText(gridRenderer, working), 'CSV'),
                child: const Text('Export CSV'),
              ),
            if (model.exportExcel)
              TextButton(
                onPressed: () => _copyExport(_exportText(gridRenderer, working), 'Excel (CSV)'),
                child: const Text('Export Excel'),
              ),
            if (model.exportPdf)
              TextButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('PDF preview'),
                      content: SingleChildScrollView(child: Text(_exportText(gridRenderer, working))),
                      actions: [
                        TextButton(
                          onPressed: () {
                            _copyExport(_exportText(gridRenderer, working), 'PDF text');
                            Navigator.pop(ctx);
                          },
                          child: const Text('Copy'),
                        ),
                      ],
                    ),
                  );
                },
                child: const Text('Export PDF'),
              ),
            if (model.grid.grouping)
              TextButton(
                onPressed: () => setState(() {
                  _groupField = _groupField == null
                      ? (gridRenderer.columnFields().isEmpty ? null : gridRenderer.columnFields().first)
                      : null;
                }),
                child: Text(_groupField == null ? EmcapLocale.t('grid.group') : EmcapLocale.t('grid.ungroup')),
              ),
          ],
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: gridRenderer.columnFields().map((field) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Column(
                  children: [
                    TextButton(
                      onPressed: () => setState(() {
                        if (_sortField == field) {
                          _sortAsc = !_sortAsc;
                        } else {
                          _sortField = field;
                          _sortAsc = true;
                        }
                      }),
                      child: Text('Sort $field'),
                    ),
                    SizedBox(
                      width: 100,
                      child: TextField(
                        decoration: InputDecoration(labelText: 'Filter $field', isDense: true),
                        onChanged: (v) => setState(() {
                          if (v.isEmpty) {
                            _filters.remove(field);
                          } else {
                            _filters[field] = v;
                          }
                          _page = 1;
                        }),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        ...groups.expand((group) {
          final widgets = <Widget>[];
          if (_groupField != null && group.key.isNotEmpty) {
            widgets.add(Text('$_groupField: ${group.key}', style: Theme.of(context).textTheme.titleSmall));
          }
          widgets.add(
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: gridRenderer.columnFields().map((field) => DataColumn(label: Text(gridRenderer.columnLabel(field)))).toList(),
                rows: group.value.map((record) {
                  final recordId = '${record['id'] ?? ''}';
                  return DataRow(
                    selected: _selectedRecordId == recordId,
                    onSelectChanged: recordId.isEmpty ? null : (_) => _selectRecord(recordId),
                    cells: gridRenderer
                        .columnFields()
                        .map((field) => DataCell(Text('${record[field] ?? ''}')))
                        .toList(),
                  );
                }).toList(),
              ),
            ),
          );
          return widgets;
        }),
      ],
    );
  }

  Widget _buildDetailPane({
    required DynamicFormRenderer formRenderer,
    required List<String> visibleFields,
  }) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_selectedRecordId != null && !_creatingNew) ...[
          Text('${EmcapLocale.t('entity.record')} $_selectedRecordId', style: Theme.of(context).textTheme.titleMedium),
          Row(
            children: [
              TextButton(onPressed: () => _startEdit(_selectedRecordId!), child: Text(EmcapLocale.t('entity.edit'))),
              TextButton(onPressed: () => _deleteRecord(_selectedRecordId!), child: Text(EmcapLocale.t('entity.delete'))),
              if (widget.entityCode == 'PRODUCT')
                TextButton(
                  onPressed: () async {
                    await widget.client.startWorkflow('STOCK_ADJUSTMENT', _selectedRecordId!);
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(EmcapLocale.t('entity.workflowStarted'))));
                  },
                  child: Text(EmcapLocale.t('entity.startWorkflow')),
                ),
            ],
          ),
          if (_loadingDetail)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: LinearProgressIndicator(),
            )
          else ...[
            Text('${EmcapLocale.t('record.notes')} (${_selectedNotes.length})'),
            ..._selectedNotes.map(
              (note) => ListTile(dense: true, title: Text('${note['body'] ?? ''}')),
            ),
            Text('${EmcapLocale.t('record.documents')} (${_selectedDocuments.length})'),
            ..._selectedDocuments.map(
              (doc) => ListTile(
                dense: true,
                title: Text('${doc['filename'] ?? doc['id'] ?? ''} v${doc['version'] ?? 1}'),
                trailing: IconButton(
                  icon: const Icon(Icons.visibility),
                  onPressed: () async {
                    final full = await widget.client.getDocument('${doc['id']}');
                    if (!context.mounted) return;
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: Text('${full['filename']}'),
                        content: Text('${full['ocr_text'] ?? full['virus_scan_status'] ?? ''}'),
                      ),
                    );
                  },
                ),
              ),
            ),
            Text('${EmcapLocale.t('record.audit')} (${_selectedAudit.length})'),
            ..._selectedAudit.map(
              (entry) => ListTile(
                dense: true,
                title: Text('${entry['action']}'),
                subtitle: Text('${entry['payload'] ?? ''}'),
              ),
            ),
            TextField(
              controller: _docFilename,
              decoration: const InputDecoration(labelText: 'Document filename'),
            ),
            TextField(
              controller: _docContent,
              decoration: const InputDecoration(labelText: 'Document content'),
            ),
            TextButton(
              onPressed: () async {
                await widget.client.uploadDocument(
                  widget.entityCode,
                  _selectedRecordId!,
                  _docFilename.text,
                  _docContent.text,
                );
                await _selectRecord(_selectedRecordId!);
              },
              child: const Text('Upload document'),
            ),
            const Divider(),
          ],
        ] else if (_creatingNew)
          Text(EmcapLocale.t('entity.newRecord'), style: Theme.of(context).textTheme.titleMedium),
        if (_creatingNew || _editingId != null) ...[
          ...formRenderer.layoutRows(visibleFields).map(
            (rowNames) => Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final name in rowNames)
                  Expanded(
                    flex: formRenderer.layoutSpan(name),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8, bottom: 8),
                      child: _fieldInput(formRenderer, name),
                    ),
                  ),
              ],
            ),
          ),
          if (_creatingNew)
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Note (optional)'),
              maxLines: 2,
            ),
          if (_createError != null) ...[
            Text(_createError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 8),
          ],
          if (_editingId != null)
            TextButton(
              onPressed: () => setState(() {
                _editingId = null;
                _clearControllers();
              }),
              child: const Text('Cancel edit'),
            ),
          ElevatedButton(
            onPressed: _creating ? null : _saveRecord,
            child: _creating
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(_editingId != null || _creatingNew ? 'Save' : 'Create record'),
          ),
        ],
      ],
    );
  }
}

class _EntityViewModel {
  _EntityViewModel({
    required this.form,
    required this.grid,
    required this.records,
    required this.syncVersion,
    required this.changeCount,
    required this.exportCsv,
    required this.exportExcel,
    required this.exportPdf,
  });

  final FormMetadata form;
  final GridMetadata grid;
  final List<Map<String, dynamic>> records;
  final String syncVersion;
  final int changeCount;
  final bool exportCsv;
  final bool exportExcel;
  final bool exportPdf;
}
