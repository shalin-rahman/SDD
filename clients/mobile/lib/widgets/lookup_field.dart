import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../metadata_contract.dart';
import '../services/i18n_service.dart';
import '../utils/lookup_display.dart';

class LookupPickerDialog extends StatefulWidget {
  const LookupPickerDialog({
    super.key,
    required this.client,
    required this.entityCode,
    this.selectedId,
  });

  final EmcapClient client;
  final String entityCode;
  final String? selectedId;

  static Future<String?> show(
    BuildContext context, {
    required EmcapClient client,
    required String entityCode,
    String? selectedId,
  }) {
    return showDialog<String?>(
      context: context,
      builder: (ctx) => LookupPickerDialog(
        client: client,
        entityCode: entityCode,
        selectedId: selectedId,
      ),
    );
  }

  @override
  State<LookupPickerDialog> createState() => _LookupPickerDialogState();
}

class _LookupPickerDialogState extends State<LookupPickerDialog> {
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> _records = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRecords();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRecords() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = _searchController.text.trim();
      final response = await widget.client.listRecords(
        widget.entityCode,
        q: query.isEmpty ? null : query,
        limit: 500,
      );
      if (!mounted) return;
      setState(() {
        _records = response.records;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _records = [];
        _loading = false;
        _error = EmcapLocale.t('field.lookup.loadFailed');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('${EmcapLocale.t('field.lookup.title')} ${widget.entityCode}'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: EmcapLocale.t('field.lookup.search'),
                border: const OutlineInputBorder(),
              ),
              onSubmitted: (_) => _loadRecords(),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: _loadRecords, child: Text(EmcapLocale.t('field.lookup.search'))),
            ),
            if (_loading)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(EmcapLocale.t('field.lookup.loading')),
              )
            else if (_error != null)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              )
            else if (_records.isEmpty)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(EmcapLocale.t('field.lookup.empty')),
              )
            else
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _records.length,
                  itemBuilder: (context, index) {
                    final record = _records[index];
                    final id = '${record['id'] ?? ''}';
                    final selected = id == (widget.selectedId ?? '');
                    return ListTile(
                      title: Text(resolveRecordDisplayLabel(record)),
                      selected: selected,
                      onTap: id.isEmpty ? null : () => Navigator.pop(context, id),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, null), child: Text(EmcapLocale.t('field.lookup.clear'))),
        TextButton(onPressed: () => Navigator.pop(context), child: Text(EmcapLocale.t('entity.cancel'))),
      ],
    );
  }
}

class LookupField extends StatefulWidget {
  const LookupField({
    super.key,
    required this.client,
    required this.field,
    required this.label,
    this.value,
    required this.onChanged,
  });

  final EmcapClient client;
  final FormFieldMetadata field;
  final String label;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  State<LookupField> createState() => _LookupFieldState();
}

class _LookupFieldState extends State<LookupField> {
  String _displayLabel = '—';
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _refreshLabel();
  }

  @override
  void didUpdateWidget(covariant LookupField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value || oldWidget.field.lookupEntity != widget.field.lookupEntity) {
      _refreshLabel();
    }
  }

  Future<void> _refreshLabel() async {
    final id = widget.value;
    final entityCode = widget.field.lookupEntity;
    if (id == null || id.isEmpty || entityCode == null || entityCode.isEmpty) {
      setState(() => _displayLabel = '—');
      return;
    }
    setState(() => _loading = true);
    try {
      final record = await widget.client.getRecord(entityCode, id);
      if (!mounted) return;
      setState(() {
        _displayLabel = resolveRecordDisplayLabel(record);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _displayLabel = id;
        _loading = false;
      });
    }
  }

  Future<void> _openPicker() async {
    final entityCode = widget.field.lookupEntity;
    if (entityCode == null || entityCode.isEmpty) {
      return;
    }
    final selected = await LookupPickerDialog.show(
      context,
      client: widget.client,
      entityCode: entityCode,
      selectedId: widget.value,
    );
    if (selected == null && widget.value != null) {
      widget.onChanged(null);
    } else if (selected != null) {
      widget.onChanged(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            border: Border.all(color: Theme.of(context).dividerColor),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(_loading ? EmcapLocale.t('field.lookup.loading') : _displayLabel),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            OutlinedButton(
              onPressed: _openPicker,
              child: Text('${EmcapLocale.t('field.lookup.choose')} ${widget.field.lookupEntity ?? ''}'),
            ),
            if (widget.value != null && widget.value!.isNotEmpty)
              TextButton(onPressed: () => widget.onChanged(null), child: Text(EmcapLocale.t('field.lookup.clear'))),
          ],
        ),
      ],
    );
  }
}
