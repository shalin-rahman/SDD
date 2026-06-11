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
    super.dispose();
  }

  Future<_EntityViewModel> _load() async {
    final formJson = await widget.client.getFormMetadata(widget.entityCode);
    final gridJson = await widget.client.getGridMetadata(widget.entityCode);
    final records = await widget.client.listRecords(widget.entityCode);
    final snapshot = await widget.client.syncSnapshot(widget.entityCode);
    final form = FormMetadata.fromJson(formJson);
    final grid = GridMetadata.fromJson(gridJson);
    _syncControllers(DynamicFormRenderer(form).fieldNames());
    return _EntityViewModel(
      form: form,
      grid: grid,
      records: records,
      syncVersion: snapshot['sync_version'] as String? ?? '',
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
              Text('Offline snapshot: ${model.syncVersion}'),
              const SizedBox(height: 12),
              DataTable(
                columns: gridRenderer
                    .columnFields()
                    .map((field) => DataColumn(label: Text(field)))
                    .toList(),
                rows: model.records
                    .map(
                      (record) => DataRow(
                        cells: gridRenderer
                            .columnFields()
                            .map((field) => DataCell(Text('${record[field] ?? ''}')))
                            .toList(),
                      ),
                    )
                    .toList(),
              ),
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
  });

  final FormMetadata form;
  final GridMetadata grid;
  final List<Map<String, dynamic>> records;
  final String syncVersion;
}
