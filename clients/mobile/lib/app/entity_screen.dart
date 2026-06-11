import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../metadata_contract.dart';

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
  String? _createError;
  String? _selectedRecordId;
  List<Map<String, dynamic>> _selectedNotes = [];
  List<Map<String, dynamic>> _selectedDocuments = [];
  List<Map<String, dynamic>> _selectedAudit = [];
  final _docFilename = TextEditingController(text: 'spec.txt');
  final _docContent = TextEditingController(text: 'uploaded from mobile');
  bool _loadingDetail = false;
  bool _realtimeStarted = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _noteController.dispose();
    _docFilename.dispose();
    _docContent.dispose();
    super.dispose();
  }

  Future<_EntityViewModel> _load() async {
    final formJson = await widget.client.getFormMetadata(widget.entityCode);
    final gridJson = await widget.client.getGridMetadata(widget.entityCode);
    final records = await widget.client.listRecords(widget.entityCode);
    final snapshot = await widget.client.syncSnapshot(widget.entityCode);
    final form = FormMetadata.fromJson(formJson);
    final grid = GridMetadata.fromJson(gridJson);
    final exportCsv = (gridJson['export'] as Map?)?['csv'] == true;
    final syncVersion = snapshot['sync_version'] as String? ?? '';
    var changeCount = 0;
    if (grid.offline && syncVersion.isNotEmpty) {
      final changes = await widget.client.syncChanges(widget.entityCode, syncVersion);
      changeCount = changes['count'] as int? ?? 0;
    }
    _syncControllers(DynamicFormRenderer(form).fieldNames());
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
    );
  }

  Future<void> _reload() async {
    setState(() {
      _createError = null;
      _future = _load();
    });
  }

  Future<void> _createRecord() async {
    setState(() {
      _creating = true;
      _createError = null;
    });
    try {
      final created = await widget.client.createRecord(widget.entityCode, _collectDraft());
      final note = _noteController.text.trim();
      if (note.isNotEmpty) {
        await widget.client.addNote(
          widget.entityCode,
          created['id'] as String,
          note,
        );
      }
      _clearControllers();
      _noteController.clear();
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
    return {for (final entry in _controllers.entries) entry.key: entry.value.text};
  }

  void _clearControllers() {
    for (final controller in _controllers.values) {
      controller.clear();
    }
  }

  Future<void> _selectRecord(String recordId) async {
    setState(() {
      _selectedRecordId = recordId;
      _loadingDetail = true;
      _selectedNotes = [];
      _selectedDocuments = [];
      _selectedAudit = [];
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: FutureBuilder<_EntityViewModel>(
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
            return const Center(child: Text('Invalid metadata contract'));
          }
          final formRenderer = DynamicFormRenderer(model.form);
          final gridRenderer = DynamicGridRenderer(model.grid);
          final fieldNames = formRenderer.fieldNames();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                model.changeCount > 0
                    ? 'Offline snapshot: ${model.syncVersion} · ${model.changeCount} change(s)'
                    : 'Offline snapshot: ${model.syncVersion}',
              ),
              if (model.exportCsv)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () {
                      final cols = gridRenderer.columnFields();
                      final sb = StringBuffer(cols.join(','));
                      for (final record in model.records) {
                        sb.writeln();
                        sb.write(cols.map((c) => '${record[c] ?? ''}').join(','));
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('CSV ready (${model.records.length} rows) — copy from logs in prod')),
                      );
                    },
                    child: const Text('Export CSV'),
                  ),
                ),
              const SizedBox(height: 12),
              DataTable(
                columns: gridRenderer
                    .columnFields()
                    .map((field) => DataColumn(label: Text(field)))
                    .toList(),
                rows: model.records
                    .map(
                      (record) {
                        final recordId = '${record['id'] ?? ''}';
                        return DataRow(
                          selected: _selectedRecordId == recordId,
                          onSelectChanged: recordId.isEmpty
                              ? null
                              : (_) => _selectRecord(recordId),
                          cells: gridRenderer
                              .columnFields()
                              .map((field) => DataCell(Text('${record[field] ?? ''}')))
                              .toList(),
                        );
                      },
                    )
                    .toList(),
              ),
              if (_selectedRecordId != null) ...[
                const SizedBox(height: 8),
                Text('Record $_selectedRecordId'),
                if (_loadingDetail)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: LinearProgressIndicator(),
                  )
                else ...[
                  Text('Notes (${_selectedNotes.length})'),
                  ..._selectedNotes.map(
                    (note) => ListTile(
                      dense: true,
                      title: Text('${note['body'] ?? ''}'),
                    ),
                  ),
                  Text('Documents (${_selectedDocuments.length})'),
                  ..._selectedDocuments.map(
                    (doc) => ListTile(
                      dense: true,
                      title: Text('${doc['filename'] ?? doc['id'] ?? ''}'),
                    ),
                  ),
                  Text('Audit (${_selectedAudit.length})'),
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
                ],
              ],
              const SizedBox(height: 12),
              ...fieldNames.map(
                (name) => TextField(
                  controller: _controllers[name],
                  decoration: InputDecoration(labelText: name),
                ),
              ),
              TextField(
                controller: _noteController,
                decoration: const InputDecoration(labelText: 'Note (optional)'),
                maxLines: 2,
              ),
              if (_createError != null) ...[
                Text(_createError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                const SizedBox(height: 8),
              ],
              ElevatedButton(
                onPressed: _creating ? null : _createRecord,
                child: _creating
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create record'),
              ),
            ],
          );
        },
      ),
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
  });

  final FormMetadata form;
  final GridMetadata grid;
  final List<Map<String, dynamic>> records;
  final String syncVersion;
  final int changeCount;
  final bool exportCsv;
}
