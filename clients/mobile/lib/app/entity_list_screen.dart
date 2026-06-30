import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/emcap_client.dart';
import '../metadata_contract.dart';
import '../theme/app_tokens.dart';
import '../services/i18n_service.dart';
import '../utils/field_display.dart';
import '../utils/locale_format_util.dart';
import 'entity_record_screen.dart';

class EntityListScreen extends StatefulWidget {
  const EntityListScreen({
    super.key,
    required this.client,
    required this.entityCode,
    required this.title,
    this.showPageTitle = true,
    this.onOpenWorkflowInbox,
  });

  final EmcapClient client;
  final String entityCode;
  final String title;
  /// When false, title is shown only by the shell AppBar (avoids duplicate headings).
  final bool showPageTitle;
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
  int _totalRecords = 0;
  String _syncVersion = '';
  int _changeCount = 0;
  bool _exportCsv = false;
  bool _exportExcel = false;
  bool _exportPdf = false;
  bool _bulkActions = false;
  final Set<String> _selectedRecordIds = {};
  String? _bulkError;
  bool _realtimeEnabled = false;

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
    widget.client.cancelRecordsStream();
    EmcapLocale.locale.removeListener(_onLocaleChanged);
    _searchController.dispose();
    super.dispose();
  }

  Future<EntityRecordsPage> _fetchRecordsPage() {
    return widget.client.listRecords(
      widget.entityCode,
      q: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      limit: _pageSize,
      offset: (_page - 1) * _pageSize,
    );
  }

  Future<void> _loadEntity() async {
    setState(() {
      _loadingEntity = true;
      _loadError = null;
    });
    try {
      final formJson = await widget.client.getFormMetadata(widget.entityCode);
      final gridJson = await widget.client.getGridMetadata(widget.entityCode);
      final recordsPage = await _fetchRecordsPage();
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
        _realtimeEnabled = true;
        widget.client.subscribeRecordsStream(widget.entityCode, () {
          if (mounted) _reloadList();
        });
      }
      if (!mounted) return;
      setState(() {
        _form = form;
        _grid = grid;
        _records = recordsPage.records;
        _totalRecords = recordsPage.total ?? recordsPage.records.length;
        _syncVersion = syncVersion;
        _changeCount = changeCount;
        _exportCsv = exportMap['csv'] == true;
        _exportExcel = exportMap['excel'] == true;
        _exportPdf = exportMap['pdf'] == true;
        _bulkActions = grid.bulkActions;
        if (!_bulkActions) {
          _selectedRecordIds.clear();
        }
        _bulkError = null;
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
      final recordsPage = await _fetchRecordsPage();
      if (!mounted) return;
      setState(() {
        _records = recordsPage.records;
        _totalRecords = recordsPage.total ?? recordsPage.records.length;
      });
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

  void _toggleSelectRecord(String recordId) {
    setState(() {
      if (_selectedRecordIds.contains(recordId)) {
        _selectedRecordIds.remove(recordId);
      } else {
        _selectedRecordIds.add(recordId);
      }
      _bulkError = null;
    });
  }

  void _toggleSelectAllPage(List<Map<String, dynamic>> pageRecords) {
    final pageIds = pageRecords
        .map((record) => '${record['id'] ?? ''}')
        .where((id) => id.isNotEmpty)
        .toList();
    setState(() {
      final allSelected = pageIds.isNotEmpty && pageIds.every(_selectedRecordIds.contains);
      if (allSelected) {
        _selectedRecordIds.removeAll(pageIds);
      } else {
        _selectedRecordIds.addAll(pageIds);
      }
      _bulkError = null;
    });
  }

  List<Map<String, dynamic>> _selectedRecords(List<Map<String, dynamic>> working) {
    return working.where((record) => _selectedRecordIds.contains('${record['id'] ?? ''}')).toList();
  }

  Future<void> _bulkDeleteSelected() async {
    if (!_bulkActions || _selectedRecordIds.isEmpty) return;
    setState(() => _bulkError = null);
    try {
      for (final id in _selectedRecordIds.toList()) {
        await widget.client.deleteRecord(widget.entityCode, id);
      }
      if (!mounted) return;
      setState(() => _selectedRecordIds.clear());
      await _reloadList();
    } catch (err) {
      if (!mounted) return;
      setState(() => _bulkError = EmcapLocale.t('entity.bulkDeleteFailed'));
    }
  }

  void _exportSelected(String label, DynamicGridRenderer gridRenderer, List<Map<String, dynamic>> working) {
    final rows = _selectedRecords(working);
    if (rows.isEmpty) return;
    _copyExport(_exportText(gridRenderer, rows), label);
  }

  bool _isPageFullySelected(List<Map<String, dynamic>> pageRecords) {
    final pageIds = pageRecords
        .map((record) => '${record['id'] ?? ''}')
        .where((id) => id.isNotEmpty)
        .toList();
    return pageIds.isNotEmpty && pageIds.every(_selectedRecordIds.contains);
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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(label)));
  }

  bool get _hasExportOptions => _exportCsv || _exportExcel || _exportPdf;

  TextStyle _pageTitleStyle(BuildContext context) {
    final tokens = context.emcapTokens;
    return Theme.of(context).textTheme.titleLarge!.copyWith(
          fontSize: tokens.fontTitleLg,
          fontWeight: FontWeight.w600,
          color: tokens.text,
        );
  }

  TextStyle _mutedBodyStyle(BuildContext context, {double? fontSize}) {
    final tokens = context.emcapTokens;
    return Theme.of(context).textTheme.bodySmall!.copyWith(
          fontSize: fontSize ?? tokens.fontBodySm,
          color: tokens.textMuted,
        );
  }

  Widget _pageTitle(BuildContext context, String title) {
    return Text(title, style: _pageTitleStyle(context));
  }

  Widget _listHeader(BuildContext context) {
    if (!widget.showPageTitle) {
      return Align(
        alignment: Alignment.centerRight,
        child: FilledButton(
          onPressed: () => _openRecord(creatingNew: true),
          child: Text(EmcapLocale.t('entity.new')),
        ),
      );
    }
    return Row(
      children: [
        Expanded(child: _pageTitle(context, widget.title)),
        FilledButton(
          onPressed: () => _openRecord(creatingNew: true),
          child: Text(EmcapLocale.t('entity.new')),
        ),
      ],
    );
  }

  String _snapshotLabel() {
    final locale = EmcapLocale.locale.value.languageCode;
    final formatted = formatIsoTimestamp(_syncVersion, locale);
    if (formatted != null) {
      return _changeCount > 0
          ? '${EmcapLocale.t('grid.offlinePrefix')} · $_changeCount ${EmcapLocale.t('grid.changes')} · $formatted'
          : '${EmcapLocale.t('grid.offlineStatus')} · $formatted';
    }
    return _changeCount > 0
        ? '${EmcapLocale.t('grid.offlinePrefix')} · $_changeCount ${EmcapLocale.t('grid.changes')}'
        : EmcapLocale.t('grid.offlineStatus');
  }

  Widget _offlineStatusBanner(BuildContext context) {
    final tokens = context.emcapTokens;
    final text = _snapshotLabel();
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
      decoration: BoxDecoration(
        color: tokens.surfaceContainer,
        borderRadius: BorderRadius.circular(tokens.radiusMd),
      ),
      child: Text(text, style: _mutedBodyStyle(context)),
    );
  }

  void _handleExportSelection(
    String value,
    DynamicGridRenderer gridRenderer,
    List<Map<String, dynamic>> working,
  ) {
    switch (value) {
      case 'csv':
        _copyExport(_exportText(gridRenderer, working), EmcapLocale.t('grid.exportCsv'));
      case 'excel':
        _copyExport(_exportText(gridRenderer, working), EmcapLocale.t('grid.exportExcel'));
      case 'pdf':
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(EmcapLocale.t('grid.exportPdf')),
            content: SingleChildScrollView(child: Text(_exportText(gridRenderer, working))),
            actions: [
              TextButton(
                onPressed: () {
                  _copyExport(_exportText(gridRenderer, working), EmcapLocale.t('grid.exportPdf'));
                  Navigator.pop(ctx);
                },
                child: Text(EmcapLocale.t('document.preview.download')),
              ),
            ],
          ),
        );
      case 'bulk':
        _exportSelected(EmcapLocale.t('grid.bulkExport'), gridRenderer, working);
    }
  }

  TextStyle _actionLabelStyle(BuildContext context) {
    final tokens = context.emcapTokens;
    return Theme.of(context).textTheme.bodyMedium!.copyWith(
          fontSize: tokens.fontBodyMd,
          color: tokens.text,
        );
  }

  Widget _exportMenuButton(
    BuildContext context,
    DynamicGridRenderer gridRenderer,
    List<Map<String, dynamic>> working,
  ) {
    if (!_hasExportOptions) return const SizedBox.shrink();
    final tokens = context.emcapTokens;
    return PopupMenuButton<String>(
      onSelected: (value) => _handleExportSelection(value, gridRenderer, working),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(tokens.radiusMd)),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
        decoration: BoxDecoration(
          border: Border.all(color: tokens.border),
          borderRadius: BorderRadius.circular(tokens.radiusMd),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(EmcapLocale.t('grid.exportMenu'), style: _actionLabelStyle(context)),
            Icon(Icons.arrow_drop_down, size: tokens.fontBodyMd + 4, color: tokens.textMuted),
          ],
        ),
      ),
      itemBuilder: (context) {
        final items = <PopupMenuEntry<String>>[];
        if (_exportCsv) {
          items.add(PopupMenuItem(value: 'csv', child: Text(EmcapLocale.t('grid.exportCsv'))));
        }
        if (_exportExcel) {
          items.add(PopupMenuItem(value: 'excel', child: Text(EmcapLocale.t('grid.exportExcel'))));
        }
        if (_exportPdf) {
          items.add(PopupMenuItem(value: 'pdf', child: Text(EmcapLocale.t('grid.exportPdf'))));
        }
        if (_bulkActions && _exportCsv) {
          items.add(
            PopupMenuItem(
              value: 'bulk',
              enabled: _selectedRecordIds.isNotEmpty,
              child: Text(EmcapLocale.t('grid.bulkExport')),
            ),
          );
        }
        return items;
      },
    );
  }

  Widget _actionBar(
    BuildContext context,
    DynamicGridRenderer gridRenderer,
    List<Map<String, dynamic>> pageRecords,
    List<Map<String, dynamic>> working,
    GridMetadata grid,
  ) {
    final tokens = context.emcapTokens;
    final bulkActions = <Widget>[
      if (_bulkActions) ...[
        TextButton(
          style: TextButton.styleFrom(
            padding: EdgeInsets.symmetric(horizontal: tokens.spaceSm),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            foregroundColor: tokens.text,
            textStyle: _actionLabelStyle(context),
          ),
          onPressed: pageRecords.isEmpty ? null : () => _toggleSelectAllPage(pageRecords),
          child: Text(EmcapLocale.t('grid.selectAll')),
        ),
        TextButton(
          style: TextButton.styleFrom(
            padding: EdgeInsets.symmetric(horizontal: tokens.spaceSm),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            foregroundColor: tokens.text,
            textStyle: _actionLabelStyle(context),
          ),
          onPressed: _selectedRecordIds.isEmpty ? null : _bulkDeleteSelected,
          child: Text(EmcapLocale.t('grid.bulkDelete')),
        ),
      ],
    ];
    final secondaryActions = <Widget>[
      _exportMenuButton(context, gridRenderer, working),
      if (grid.grouping)
        TextButton(
          style: TextButton.styleFrom(
            padding: EdgeInsets.symmetric(horizontal: tokens.spaceSm),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            foregroundColor: tokens.text,
            textStyle: _actionLabelStyle(context),
          ),
          onPressed: () => setState(() {
            _groupField = _groupField == null
                ? (gridRenderer.columnFields().isEmpty ? null : gridRenderer.columnFields().first)
                : null;
          }),
          child: Text(_groupField == null ? EmcapLocale.t('grid.group') : EmcapLocale.t('grid.ungroup')),
        ),
    ];
    final hasSecondary = _hasExportOptions || grid.grouping;
    if (bulkActions.isEmpty && !hasSecondary) return const SizedBox.shrink();
    return Padding(
      padding: EdgeInsets.only(top: tokens.spaceSm),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            ...bulkActions,
            if (bulkActions.isNotEmpty && hasSecondary) ...[
              SizedBox(width: tokens.spaceXs),
              VerticalDivider(width: 1, thickness: 1, color: tokens.border, indent: 4, endIndent: 4),
              SizedBox(width: tokens.spaceXs),
            ],
            ...secondaryActions,
          ],
        ),
      ),
    );
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
    final panel = Semantics(
      label: EmcapLocale.t('a11y.screenReader.loading'),
      liveRegion: true,
      container: true,
      child: ExcludeSemantics(
        child: Column(
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
        ),
      ),
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
        if (widget.showPageTitle)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: context.emcapTokens.spaceMd),
            child: _pageTitle(context, widget.title),
          ),
          Expanded(child: _errorState(_loadError!, onRetry: _loadEntity)),
        ],
      );
    }
    if (_loadingEntity && _form == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
        if (widget.showPageTitle)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: context.emcapTokens.spaceMd),
            child: _pageTitle(context, widget.title),
          ),
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
    final totalRecords = _totalRecords;
    final totalPages = (totalRecords / _pageSize).ceil().clamp(1, 9999);
    final pageRecords = working;
    final groups = gridRenderer.groupRecords(pageRecords, _groupField);
    final isEmpty = totalRecords == 0;

    return Semantics(
      label: EmcapLocale.t('a11y.landmark.main'),
      container: true,
      explicitChildNodes: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
        Padding(
          padding: EdgeInsets.fromLTRB(tokens.spaceMd, tokens.spaceSm, tokens.spaceMd, 0),
          child: _listHeader(context),
        ),
        Expanded(
          child: ListView(
            padding: EdgeInsets.all(tokens.spaceMd),
            children: [
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  labelText: EmcapLocale.t('entity.search'),
                  border: const OutlineInputBorder(),
                  isDense: true,
                ),
                onSubmitted: (_) {
                  _page = 1;
                  _reloadList();
                },
              ),
              SizedBox(height: tokens.spaceSm),
              Row(
                children: [
                  TextButton(
                    onPressed: _page > 1 && !_loadingList
                        ? () {
                            _page--;
                            _reloadList();
                          }
                        : null,
                    child: Text(EmcapLocale.t('grid.prev')),
                  ),
                  Expanded(
                    child: Text(
                      '${EmcapLocale.t('grid.page')} $_page / $totalPages ($totalRecords ${EmcapLocale.t('grid.records')})',
                      textAlign: TextAlign.center,
                      style: _mutedBodyStyle(context),
                    ),
                  ),
                  TextButton(
                    onPressed: _page < totalPages && !_loadingList
                        ? () {
                            _page++;
                            _reloadList();
                          }
                        : null,
                    child: Text(EmcapLocale.t('grid.next')),
                  ),
                ],
              ),
              if (grid.offline && _syncVersion.isNotEmpty) ...[
                SizedBox(height: tokens.spaceXs),
                _offlineStatusBanner(context),
              ],
              if (_realtimeEnabled) ...[
                SizedBox(height: tokens.spaceXs),
                Text(
                  EmcapLocale.t('settings.grid.realtime'),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: tokens.fontBodySm,
                      ),
                ),
              ],
              if (_bulkActions && _selectedRecordIds.isNotEmpty) ...[
                SizedBox(height: tokens.spaceXs),
                Text(
                  '${_selectedRecordIds.length} ${EmcapLocale.t('grid.selectedCount')}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: tokens.fontBodyMd),
                ),
              ],
              if (_bulkError != null) ...[
                SizedBox(height: tokens.spaceXs),
                Text(_bulkError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              _actionBar(context, gridRenderer, pageRecords, working, grid),
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
                              child: Text('${EmcapLocale.t('grid.sort')} $field'),
                            ),
                            SizedBox(
                              width: 100,
                              child: TextField(
                                decoration: InputDecoration(
                                  labelText: '${EmcapLocale.t('grid.filter')} $field',
                                  isDense: true,
                                ),
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
                        columns: [
                          if (_bulkActions)
                            DataColumn(
                              label: Checkbox(
                                value: _isPageFullySelected(group.value),
                                tristate: false,
                                onChanged: group.value.isEmpty
                                    ? null
                                    : (_) => _toggleSelectAllPage(group.value),
                              ),
                            ),
                          ...gridRenderer
                              .columnFields()
                              .map((field) => DataColumn(label: Text(gridRenderer.columnLabel(field)))),
                        ],
                        rows: group.value.map((record) {
                          final recordId = '${record['id'] ?? ''}';
                          final selected = _selectedRecordIds.contains(recordId);
                          return DataRow(
                            selected: _bulkActions && selected,
                            onSelectChanged: _bulkActions
                                ? (checked) {
                                    if (recordId.isEmpty) return;
                                    _toggleSelectRecord(recordId);
                                  }
                                : recordId.isEmpty
                                    ? null
                                    : (_) => _openRecord(recordId: recordId),
                            cells: [
                              if (_bulkActions)
                                DataCell(
                                  Checkbox(
                                    value: selected,
                                    onChanged: recordId.isEmpty
                                        ? null
                                        : (_) => _toggleSelectRecord(recordId),
                                  ),
                                ),
                              ...gridRenderer
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
                                      onTap: recordId.isEmpty ? null : () => _openRecord(recordId: recordId),
                                    ),
                                  ),
                            ],
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
    ),
    );
  }
}
