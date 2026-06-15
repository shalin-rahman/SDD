import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/emcap_client.dart';
import '../metadata_contract.dart';
import '../theme/app_tokens.dart';
import '../services/i18n_service.dart';
import '../utils/field_display.dart';
import 'entity_record_screen.dart';

class EntityListScreen extends StatefulWidget {
  const EntityListScreen({
    super.key,
    required this.client,
    required this.entityCode,
    required this.title,
    this.onOpenWorkflowInbox,
  });

  final EmcapClient client;
  final String entityCode;
  final String title;
  final VoidCallback? onOpenWorkflowInbox;

  @override
  State<EntityListScreen> createState() => _EntityListScreenState();
}

class _EntityListScreenState extends State<EntityListScreen> {
  bool _realtimeStarted = false;
  final _searchController = TextEditingController();
  int _page = 1;
  static const _pageSize = 10;
  String? _sortField;
  bool _sortAsc = true;
  final Map<String, String> _filters = {};
  String? _groupField;

  bool _loadingEntity = true;
  bool _loadingList = false;
  String? _loadError;
  FormMetadata? _form;
  GridMetadata? _grid;
  List<Map<String, dynamic>> _records = [];
  String _syncVersion = '';
  int _changeCount = 0;
  bool _exportCsv = false;
  bool _exportExcel = false;
  bool _exportPdf = false;

  @override
  void initState() {
    super.initState();
    EmcapLocale.locale.addListener(_onLocaleChanged);
    _loadEntity();
  }

  void _onLocaleChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    EmcapLocale.locale.removeListener(_onLocaleChanged);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadEntity() async {
    setState(() {
      _loadingEntity = true;
      _loadError = null;
    });
    try {
      final formJson = await widget.client.getFormMetadata(widget.entityCode);
      final gridJson = await widget.client.getGridMetadata(widget.entityCode);
      final records = await widget.client.listRecords(
        widget.entityCode,
        q: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      );
      final snapshot = await widget.client.syncSnapshot(widget.entityCode);
      final form = FormMetadata.fromJson(formJson);
      final grid = GridMetadata.fromJson(gridJson);
      if (!form.isValid || !grid.isValid) {
        setState(() => _loadError = EmcapLocale.t('entity.invalidMetadata'));
        return;
      }
      final exportMap = gridJson['export'] as Map? ?? {};
      final syncVersion = snapshot['sync_version'] as String? ?? '';
      var changeCount = 0;
      if (grid.offline && syncVersion.isNotEmpty) {
        final changes = await widget.client.syncChanges(widget.entityCode, syncVersion);
        changeCount = changes['count'] as int? ?? 0;
      }
      if (grid.realtime && !_realtimeStarted) {
        _realtimeStarted = true;
        widget.client.subscribeRecordsStream(widget.entityCode, () {
          if (mounted) _reloadList();
        });
      }
      if (!mounted) return;
      setState(() {
        _form = form;
        _grid = grid;
        _records = records;
        _syncVersion = syncVersion;
        _changeCount = changeCount;
        _exportCsv = exportMap['csv'] == true;
        _exportExcel = exportMap['excel'] == true;
        _exportPdf = exportMap['pdf'] == true;
      });
    } catch (err) {
      if (!mounted) return;
      final message = err.toString().replaceFirst('Exception: ', '').trim();
      setState(() => _loadError = message.isNotEmpty ? message : EmcapLocale.t('entity.loadFailed'));
    } finally {
      if (mounted) {
        setState(() => _loadingEntity = false);
      }
    }
  }

  Future<void> _reloadList() async {
    if (_form == null || _grid == null) {
      await _loadEntity();
      return;
    }
    setState(() => _loadingList = true);
    try {
      final records = await widget.client.listRecords(
        widget.entityCode,
        q: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      );
      if (!mounted) return;
      setState(() => _records = records);
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err.toString())),
      );
    } finally {
      if (mounted) {
        setState(() => _loadingList = false);
      }
    }
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

  Future<void> _openRecord({String? recordId, bool creatingNew = false}) async {
    final changed = await Navigator.of(context, rootNavigator: true).push<bool>(
      MaterialPageRoute(
        builder: (_) => EntityRecordScreen(
          client: widget.client,
          entityCode: widget.entityCode,
          title: widget.title,
          recordId: recordId,
          creatingNew: creatingNew,
          onOpenWorkflowInbox: widget.onOpenWorkflowInbox,
        ),
      ),
    );
    if (changed == true && mounted) {
      await _reloadList();
    }
  }

  Widget _loadingPanel({bool inline = false}) {
    final panel = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 12),
        Text(
          EmcapLocale.t('common.loading'),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ],
    );
    if (inline) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(child: panel),
      );
    }
    return Center(child: panel);
  }

  Widget _errorState(String message, {required VoidCallback onRetry}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: Text(EmcapLocale.t('common.retry'))),
          ],
        ),
      ),
    );
  }

  Widget _emptyGridState({required VoidCallback onCreate}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.inbox_outlined,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 12),
            Text(
              EmcapLocale.t('grid.empty'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onCreate, child: Text(EmcapLocale.t('entity.new'))),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loadError != null && _form == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
          Expanded(child: _errorState(_loadError!, onRetry: _loadEntity)),
        ],
      );
    }
    if (_loadingEntity && _form == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
          Expanded(child: _loadingPanel()),
        ],
      );
    }
    final form = _form;
    final grid = _grid;
    if (form == null || grid == null) {
      return Center(child: Text(EmcapLocale.t('entity.invalidMetadata')));
    }

    final gridRenderer = DynamicGridRenderer(grid, locale: EmcapLocale.locale.value.languageCode);
    final tokens = context.emcapTokens;
    var working = gridRenderer.filterRecords(_records, _filters);
    working = gridRenderer.sortRecords(working, _sortField, _sortAsc);
    final totalRecords = working.length;
    final totalPages = (totalRecords / _pageSize).ceil().clamp(1, 9999);
    final pageRecords = working.skip((_page - 1) * _pageSize).take(_pageSize).toList();
    final groups = gridRenderer.groupRecords(pageRecords, _groupField);
    final isEmpty = totalRecords == 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
            ),
            FilledButton(
              onPressed: () => _openRecord(creatingNew: true),
              child: Text(EmcapLocale.t('entity.new')),
            ),
          ],
        ),
        SizedBox(height: tokens.spaceSm),
        Expanded(
          child: ListView(
            padding: EdgeInsets.all(tokens.spaceSm),
            children: [
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  labelText: EmcapLocale.t('entity.search'),
                  border: const OutlineInputBorder(),
                ),
                onSubmitted: (_) {
                  _page = 1;
                  _reloadList();
                },
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: _page > 1 ? () => setState(() => _page--) : null,
                    child: Text(EmcapLocale.t('grid.prev')),
                  ),
                  Text(
                    '${EmcapLocale.t('grid.page')} $_page / $totalPages ($totalRecords ${EmcapLocale.t('grid.records')})',
                  ),
                  TextButton(
                    onPressed: _page < totalPages ? () => setState(() => _page++) : null,
                    child: Text(EmcapLocale.t('grid.next')),
                  ),
                ],
              ),
              Text(
                _changeCount > 0
                    ? '${EmcapLocale.t('grid.offlinePrefix')} · $_changeCount ${EmcapLocale.t('grid.changes')} · ${EmcapLocale.t('grid.snapshot')} $_syncVersion'
                    : '${EmcapLocale.t('grid.offlineStatus')}: $_syncVersion',
              ),
              Wrap(
                spacing: 8,
                children: [
                  if (_exportCsv)
                    TextButton(
                      onPressed: () => _copyExport(_exportText(gridRenderer, working), 'CSV'),
                      child: const Text('Export CSV'),
                    ),
                  if (_exportExcel)
                    TextButton(
                      onPressed: () => _copyExport(_exportText(gridRenderer, working), 'Excel (CSV)'),
                      child: const Text('Export Excel'),
                    ),
                  if (_exportPdf)
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
                  if (grid.grouping)
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
              if (_loadingList)
                _loadingPanel(inline: true)
              else if (isEmpty)
                _emptyGridState(onCreate: () => _openRecord(creatingNew: true))
              else ...[
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
                      child: Theme(
                        data: Theme.of(context).copyWith(
                          dataTableTheme: DataTableThemeData(
                            dataRowMinHeight: tokens.densityRowPaddingY * 2 + tokens.fontBodyMd,
                            headingRowHeight: tokens.densityHeaderPaddingY * 2 + tokens.fontBodyMd,
                            horizontalMargin: tokens.densityRowPaddingX,
                            columnSpacing: tokens.densityRowPaddingX,
                          ),
                        ),
                        child: DataTable(
                        columns: gridRenderer
                            .columnFields()
                            .map((field) => DataColumn(label: Text(gridRenderer.columnLabel(field))))
                            .toList(),
                        rows: group.value.map((record) {
                          final recordId = '${record['id'] ?? ''}';
                          return DataRow(
                            onSelectChanged: recordId.isEmpty ? null : (_) => _openRecord(recordId: recordId),
                            cells: gridRenderer
                                .columnFields()
                                .map(
                                  (field) => DataCell(
                                    Text(
                                      formatGridCellValue(
                                        field,
                                        record[field],
                                        locale: EmcapLocale.locale.value.languageCode,
                                        fieldType: gridRenderer.columnFieldType(field),
                                        currencyCode: gridRenderer.columnCurrencyCode(field),
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                );
                  return widgets;
                }),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
