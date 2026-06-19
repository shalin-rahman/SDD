import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../metadata_contract.dart';
import '../services/i18n_service.dart';
import '../theme/app_tokens.dart';
import '../utils/field_display.dart';
import '../utils/record_headline.dart';
import '../utils/record_lifecycle_util.dart';
import '../utils/payment_util.dart';
import '../utils/purchase_order_util.dart';
import '../utils/sales_order_util.dart';
import '../utils/stock_movement_util.dart';
import '../utils/workflow_enabled_util.dart';
import '../widgets/currency_field.dart';
import '../widgets/document_preview_dialog.dart';
import '../widgets/emcap_badge.dart';
import '../widgets/lookup_field.dart';

/// System fields hidden on create — platform injects these on save.
const _systemFieldsHiddenOnCreate = {
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'record_version',
  'deleted_at',
};

class EntityRecordScreen extends StatefulWidget {
  const EntityRecordScreen({
    super.key,
    required this.client,
    required this.entityCode,
    required this.title,
    this.recordId,
    this.creatingNew = false,
    this.queryParams,
    this.onOpenWorkflowInbox,
  });

  final EmcapClient client;
  final String entityCode;
  final String title;
  final String? recordId;
  final bool creatingNew;
  /// Parent FK prefill when creating child records (e.g. `po_id`, `sales_order_id`).
  final Map<String, String>? queryParams;
  final VoidCallback? onOpenWorkflowInbox;

  @override
  State<EntityRecordScreen> createState() => _EntityRecordScreenState();
}

class _EntityRecordScreenState extends State<EntityRecordScreen> {
  late Future<FormMetadata> _formFuture;
  final Map<String, TextEditingController> _controllers = {};
  final _noteController = TextEditingController();
  bool _creating = false;
  late bool _creatingNew;
  String? _createError;
  String? _selectedRecordId;
  List<Map<String, dynamic>> _selectedNotes = [];
  List<Map<String, dynamic>> _selectedDocuments = [];
  List<Map<String, dynamic>> _selectedAudit = [];
  List<Map<String, dynamic>> _workflowInstances = [];
  bool _workflowEnabled = false;
  final _docFilename = TextEditingController(text: 'spec.txt');
  final _docContent = TextEditingController(text: 'uploaded from mobile');
  bool _loadingDetail = false;
  String? _editingId;
  final Map<String, bool> _checkboxValues = {};
  final Map<String, String?> _lookupValues = {};
  Map<String, dynamic> _recordValues = {};
  bool _listChanged = false;
  List<Map<String, dynamic>> _movementLines = [];
  String? _movementLinesError;
  String? _postMovementError;
  bool _postingMovement = false;
  List<Map<String, dynamic>> _orderLines = [];
  String? _orderLinesError;
  bool _receivingPo = false;
  String? _receivePoError;
  bool _recordLoaded = false;

  @override
  void initState() {
    super.initState();
    EmcapLocale.locale.addListener(_onLocaleChanged);
    _creatingNew = widget.creatingNew;
    _selectedRecordId = widget.recordId;
    _formFuture = _loadForm().then((form) {
      if (_creatingNew) {
        _applyCreatePrefill(form);
      }
      return form;
    });
    if (_selectedRecordId != null && !_creatingNew) {
      _loadRecord(_selectedRecordId!);
    }
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
    super.dispose();
  }

  Future<FormMetadata> _loadForm() async {
    final formJson = await widget.client.getFormMetadata(widget.entityCode);
    final platformConfig = await widget.client.getPlatformConfig();
    final form = FormMetadata.fromJson(formJson);
    _syncControllers(DynamicFormRenderer(form, locale: EmcapLocale.locale.value.languageCode).fieldNames());
    _workflowEnabled = isWorkflowEnabled(platformConfig);
    return form;
  }

  void _popToList() {
    Navigator.of(context).pop(_listChanged);
  }

  List<String> _visibleFieldNames(DynamicFormRenderer formRenderer) {
    final fieldNames = formRenderer.fieldNames();
    final formValues = _formValues(formRenderer);
    final systemNames = formRenderer.sectionFieldNames('system').toSet();
    return fieldNames.where((name) {
      if (systemNames.contains(name)) return false;
      if (!formRenderer.isVisible(name, formValues)) return false;
      if (_creatingNew && _systemFieldsHiddenOnCreate.contains(name)) return false;
      return true;
    }).toList();
  }

  Future<void> _saveRecord() async {
    setState(() {
      _creating = true;
      _createError = null;
    });
    try {
      final formJson = await widget.client.getFormMetadata(widget.entityCode);
      final formRenderer = DynamicFormRenderer(FormMetadata.fromJson(formJson), locale: EmcapLocale.locale.value.languageCode);
      final draft = _collectDraft(formRenderer);
      for (final name in formRenderer.fieldNames()) {
        if (formRenderer.isReadOnly(name)) continue;
        if (!formRenderer.isVisible(name, draft)) continue;
        final meta = fieldMetadata(formRenderer.metadata, name);
        if (meta == null) continue;
        final value = _draftFieldValue(name, meta);
        final err = formRenderer.validateField(meta, value);
        if (err != null) throw Exception(err);
      }
      if (_editingId != null) {
        final version = _recordValues['record_version'];
        final ifMatch = version is int ? version : int.tryParse('$version');
        await widget.client.updateRecord(
          widget.entityCode,
          _editingId!,
          draft,
          ifMatch: ifMatch,
        );
        _editingId = null;
        _listChanged = true;
        await _loadRecord(_selectedRecordId!);
      } else {
        final created = await widget.client.createRecord(widget.entityCode, draft);
        final note = _noteController.text.trim();
        final createdId = '${created['id']}';
        if (note.isNotEmpty) {
          await widget.client.addNote(widget.entityCode, createdId, note);
        }
        _noteController.clear();
        _clearControllers();
        _listChanged = true;
        setState(() {
          _creatingNew = false;
          _selectedRecordId = createdId;
          _editingId = null;
        });
        await _loadRecord(createdId);
      }
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

  dynamic _draftFieldValue(String name, Map<String, dynamic> meta) {
    final type = meta['field_type'] as String? ?? 'text';
    if (type == 'checkbox') {
      return _checkboxValues[name];
    }
    if (type == 'lookup') {
      return _lookupValues[name];
    }
    if (type == 'currency') {
      final text = _controllers[name]?.text.trim() ?? '';
      if (text.isEmpty) {
        return null;
      }
      return double.tryParse(text);
    }
    return _controllers[name]?.text;
  }

  Map<String, dynamic> _collectDraft(DynamicFormRenderer renderer) {
    final systemNames = renderer.sectionFieldNames('system');
    final draft = <String, dynamic>{};
    for (final name in _controllers.keys) {
      if (renderer.isReadOnly(name) || systemNames.contains(name)) {
        continue;
      }
      final meta = fieldMetadata(renderer.metadata, name);
      if (meta == null) {
        continue;
      }
      final value = _draftFieldValue(name, meta);
      if (value != null && !(value is String && value.isEmpty)) {
        draft[name] = value;
      } else if (_lookupValues.containsKey(name) && _lookupValues[name] != null) {
        draft[name] = _lookupValues[name];
      }
    }
    for (final entry in _lookupValues.entries) {
      if (renderer.isReadOnly(entry.key) || systemNames.contains(entry.key)) {
        continue;
      }
      if (entry.value != null && entry.value!.isNotEmpty) {
        draft[entry.key] = entry.value;
      }
    }
    for (final entry in _checkboxValues.entries) {
      if (renderer.isReadOnly(entry.key) || systemNames.contains(entry.key)) {
        continue;
      }
      draft[entry.key] = entry.value;
    }
    return draft;
  }

  Map<String, dynamic> _formValues(DynamicFormRenderer renderer) {
    if (_editingId != null || _creatingNew) {
      return _collectDraft(renderer);
    }
    return _recordValues;
  }

  RecordHeadlineView _recordHeadlineView(FormMetadata formMeta) {
    final locale = EmcapLocale.locale.value.languageCode;
    return buildRecordHeadlineView(
      widget.entityCode,
      _recordValues,
      _creatingNew,
      _selectedRecordId,
      EmcapLocale.t,
      statusField: formMeta.display?.statusField,
      locale: locale,
    );
  }

  Widget _fieldInput(
    DynamicFormRenderer renderer,
    String name,
    Map<String, dynamic> values, {
    bool forceReadOnly = false,
  }) {
    final locale = EmcapLocale.locale.value.languageCode;
    final field = renderer.getField(name);
    if (forceReadOnly || renderer.isReadOnly(name)) {
      final value = values[name];
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(renderer.label(name), style: Theme.of(context).textTheme.labelMedium),
            Text(
              formatRecordFieldValue(
                name,
                field?.fieldType ?? 'text',
                value,
                locale: locale,
                currencyCode: field?.currencyCode,
              ),
            ),
          ],
        ),
      );
    }
    final meta = fieldMetadata(renderer.metadata, name);
    if (meta == null) {
      return const SizedBox.shrink();
    }
    final fieldMeta = FormFieldMetadata.fromMap(meta);
    final type = fieldMeta.fieldType;
    if (type == 'checkbox') {
      return CheckboxListTile(
        title: Text(renderer.label(name)),
        value: _checkboxValues[name] ?? false,
        onChanged: (v) => setState(() => _checkboxValues[name] = v ?? false),
      );
    }
    if (type == 'select') {
      return DropdownButtonFormField<String?>(
        decoration: InputDecoration(labelText: renderer.label(name)),
        value: (_controllers[name]?.text.isEmpty ?? true) ? null : _controllers[name]!.text,
        items: [
          const DropdownMenuItem<String?>(value: null, child: Text('')),
          ...fieldMeta.options.map((opt) => DropdownMenuItem<String?>(value: opt, child: Text(opt))),
        ],
        onChanged: (v) => setState(() => _controllers[name]!.text = v ?? ''),
      );
    }
    if (type == 'lookup') {
      return LookupField(
        client: widget.client,
        field: fieldMeta,
        label: renderer.label(name),
        value: _lookupValues[name],
        onChanged: (v) => setState(() => _lookupValues[name] = v),
      );
    }
    if (type == 'currency') {
      return CurrencyField(
        field: fieldMeta,
        label: renderer.label(name),
        controller: _controllers[name]!,
      );
    }
    if (type == 'textarea') {
      return TextareaField(
        label: renderer.label(name),
        controller: _controllers[name]!,
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
    _lookupValues.clear();
    _checkboxValues.clear();
  }

  Future<void> _startEdit(String recordId) async {
    final record = await widget.client.getRecord(widget.entityCode, recordId);
    final formJson = await widget.client.getFormMetadata(widget.entityCode);
    final renderer = DynamicFormRenderer(FormMetadata.fromJson(formJson), locale: EmcapLocale.locale.value.languageCode);
    for (final name in renderer.fieldNames()) {
      final value = record[name];
      final field = renderer.getField(name);
      if (field?.fieldType == 'checkbox') {
        _checkboxValues[name] = value == true;
      } else if (field?.fieldType == 'lookup') {
        _lookupValues[name] = value?.toString();
      } else if (_controllers.containsKey(name)) {
        _controllers[name]!.text = '${value ?? ''}';
      }
    }
    setState(() {
      _recordValues = Map<String, dynamic>.from(record);
      _editingId = recordId;
      _creatingNew = false;
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
    final deleted = await widget.client.deleteRecord(widget.entityCode, recordId);
    setState(() {
      _recordValues = Map<String, dynamic>.from(deleted);
      _editingId = null;
    });
    _listChanged = true;
    await _loadRecord(recordId);
  }

  Future<void> _restoreRecord(String recordId) async {
    final restored = await widget.client.restoreRecord(widget.entityCode, recordId);
    setState(() {
      _recordValues = Map<String, dynamic>.from(restored);
    });
    _listChanged = true;
    await _startEdit(recordId);
  }

  bool _canRestoreRecord() {
    return canRestoreRecord(_selectedRecordId, _recordValues);
  }

  bool _canDeleteRecord() {
    return canDeleteRecord(_selectedRecordId, _recordValues, _creatingNew);
  }

  bool _canPostMovement() {
    return canPostMovement(
      widget.entityCode,
      _recordValues,
      recordId: _selectedRecordId,
      creatingNew: _creatingNew,
    );
  }

  Future<void> _postMovement() async {
    if (!_canPostMovement() || _selectedRecordId == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(EmcapLocale.t('entity.postMovementConfirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(EmcapLocale.t('common.cancel'))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(EmcapLocale.t('entity.postMovement'))),
        ],
      ),
    );
    if (ok != true) return;
    setState(() {
      _postingMovement = true;
      _postMovementError = null;
    });
    try {
      final version = _recordValues['record_version'];
      final ifMatch = version is int ? version : int.tryParse('$version');
      await widget.client.updateRecord(
        widget.entityCode,
        _selectedRecordId!,
        {'status': 'posted'},
        ifMatch: ifMatch,
      );
      _listChanged = true;
      await _loadRecord(_selectedRecordId!);
    } catch (err) {
      if (!mounted) return;
      setState(() => _postMovementError = EmcapLocale.t('entity.postMovementFailed'));
    } finally {
      if (mounted) {
        setState(() => _postingMovement = false);
      }
    }
  }

  Future<void> _loadMovementLines(String recordId) async {
    if (widget.entityCode != 'STOCK_MOVEMENT') {
      setState(() {
        _movementLines = [];
        _movementLinesError = null;
      });
      return;
    }
    try {
      final lines = await widget.client.listRecords('STOCK_MOVEMENT_LINE');
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() {
        _movementLines = filterMovementLines(lines, recordId);
        _movementLinesError = null;
      });
    } catch (err) {
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() {
        _movementLines = [];
        _movementLinesError = EmcapLocale.t('entity.movementLinesFailed');
      });
    }
  }

  void _applyCreatePrefill(FormMetadata formMeta) {
    final params = widget.queryParams;
    if (!_creatingNew || params == null || params.isEmpty) {
      return;
    }
    final renderer = DynamicFormRenderer(formMeta, locale: EmcapLocale.locale.value.languageCode);
    var changed = false;
    for (final entry in params.entries) {
      if (!renderer.fieldNames().contains(entry.key)) {
        continue;
      }
      final field = renderer.getField(entry.key);
      if (field?.fieldType == 'lookup') {
        _lookupValues[entry.key] = entry.value;
        changed = true;
      } else if (_controllers.containsKey(entry.key)) {
        _controllers[entry.key]!.text = entry.value;
        changed = true;
      }
    }
    if (changed && mounted) {
      setState(() {});
    }
  }

  bool _showOrderLinesSection() {
    return (widget.entityCode == 'PURCHASE_ORDER' || widget.entityCode == 'SALES_ORDER') &&
        _selectedRecordId != null &&
        !_creatingNew;
  }

  String _orderLinesTitle() {
    if (widget.entityCode == 'PURCHASE_ORDER') {
      return EmcapLocale.t('procurement.po.lines');
    }
    return EmcapLocale.t('sales.so.lines');
  }

  String _orderLinesEmptyLabel() {
    if (widget.entityCode == 'PURCHASE_ORDER') {
      return EmcapLocale.t('procurement.po.linesEmpty');
    }
    return EmcapLocale.t('sales.so.linesEmpty');
  }

  String _orderLinesFailedLabel() {
    if (widget.entityCode == 'PURCHASE_ORDER') {
      return EmcapLocale.t('procurement.po.linesFailed');
    }
    return EmcapLocale.t('sales.so.linesFailed');
  }

  Future<void> _loadOrderLines(String recordId) async {
    if (!_showOrderLinesSection()) {
      setState(() {
        _orderLines = [];
        _orderLinesError = null;
      });
      return;
    }
    final lineEntity = widget.entityCode == 'PURCHASE_ORDER'
        ? purchaseOrderLineEntityCode
        : salesOrderLineEntityCode;
    try {
      final lines = await widget.client.listRecords(lineEntity);
      if (!mounted || _selectedRecordId != recordId) return;
      final filtered = widget.entityCode == 'PURCHASE_ORDER'
          ? filterPurchaseOrderLines(lines, recordId)
          : filterSalesOrderLines(lines, recordId);
      setState(() {
        _orderLines = filtered;
        _orderLinesError = null;
      });
    } catch (err) {
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() {
        _orderLines = [];
        _orderLinesError = _orderLinesFailedLabel();
      });
    }
  }

  bool _canReceivePurchaseOrder() {
    return canReceivePurchaseOrder(
      widget.entityCode,
      _recordValues,
      recordId: _selectedRecordId,
      creatingNew: _creatingNew,
      orderLineCount: _orderLines.length,
    );
  }

  bool _canAddOrderLine() {
    if (widget.entityCode == 'PURCHASE_ORDER') {
      return canAddPurchaseOrderLine(
        widget.entityCode,
        _recordValues,
        recordId: _selectedRecordId,
        creatingNew: _creatingNew,
      );
    }
    if (widget.entityCode == 'SALES_ORDER') {
      return canAddSalesOrderLine(
        widget.entityCode,
        _recordValues,
        recordId: _selectedRecordId,
        creatingNew: _creatingNew,
      );
    }
    return false;
  }

  bool _canRecordVendorPayment() {
    return canRecordVendorPayment(
      widget.entityCode,
      _recordValues,
      recordId: _selectedRecordId,
      creatingNew: _creatingNew,
    );
  }

  bool _canCollectCustomerPayment() {
    return canCollectCustomerPayment(
      widget.entityCode,
      _recordValues,
      recordId: _selectedRecordId,
      creatingNew: _creatingNew,
    );
  }

  Future<void> _receivePurchaseOrder() async {
    if (!_canReceivePurchaseOrder() || _selectedRecordId == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(EmcapLocale.t('procurement.po.receiveConfirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(EmcapLocale.t('common.cancel'))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(EmcapLocale.t('procurement.po.receive'))),
        ],
      ),
    );
    if (ok != true) return;
    setState(() {
      _receivingPo = true;
      _receivePoError = null;
    });
    try {
      final version = _recordValues['record_version'];
      final ifMatch = version is int ? version : int.tryParse('$version');
      await widget.client.updateRecord(
        widget.entityCode,
        _selectedRecordId!,
        {'status': 'received'},
        ifMatch: ifMatch,
      );
      _listChanged = true;
      await _loadRecord(_selectedRecordId!);
    } catch (err) {
      if (!mounted) return;
      setState(() => _receivePoError = EmcapLocale.t('procurement.po.receiveFailed'));
    } finally {
      if (mounted) {
        setState(() => _receivingPo = false);
      }
    }
  }

  Future<void> _openChildCreate(String childEntityCode, Map<String, String> prefill) async {
    final changed = await Navigator.of(context, rootNavigator: true).push<bool>(
      MaterialPageRoute(
        builder: (_) => EntityRecordScreen(
          client: widget.client,
          entityCode: childEntityCode,
          title: childEntityCode,
          creatingNew: true,
          queryParams: prefill,
        ),
      ),
    );
    if (changed == true && _selectedRecordId != null && mounted) {
      _listChanged = true;
      await _loadRecord(_selectedRecordId!);
    }
  }

  void _addOrderLine() {
    if (!_canAddOrderLine() || _selectedRecordId == null) return;
    if (widget.entityCode == 'PURCHASE_ORDER') {
      _openChildCreate(
        purchaseOrderLineEntityCode,
        {purchaseOrderCreatePrefillParam: _selectedRecordId!},
      );
      return;
    }
    if (widget.entityCode == 'SALES_ORDER') {
      _openChildCreate(
        salesOrderLineEntityCode,
        {salesOrderCreatePrefillParam: _selectedRecordId!},
      );
    }
  }

  void _recordVendorPayment() {
    if (!_canRecordVendorPayment() || _selectedRecordId == null) return;
    _openChildCreate(
      vendorPaymentEntityCode,
      vendorPaymentPrefill(_recordValues, _selectedRecordId!),
    );
  }

  void _collectCustomerPayment() {
    if (!_canCollectCustomerPayment() || _selectedRecordId == null) return;
    _openChildCreate(
      customerPaymentEntityCode,
      customerPaymentPrefill(_recordValues, _selectedRecordId!),
    );
  }

  Widget _buildPaymentSummaryCard() {
    if (!showPaymentSummaryCard(widget.entityCode)) {
      return const SizedBox.shrink();
    }
    final summary = buildPaymentSummary(widget.entityCode, _recordValues);
    if (summary == null) {
      return const SizedBox.shrink();
    }
    final locale = EmcapLocale.locale.value.languageCode;
    String fmt(double amount) =>
        formatRecordFieldValue('amount', 'currency', amount, locale: locale, currencyCode: 'USD');
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(EmcapLocale.t('procurement.payment.summary'), style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Text('${EmcapLocale.t('procurement.payment.total')}: ${fmt(summary.total)}'),
            Text('${EmcapLocale.t('procurement.payment.paid')}: ${fmt(summary.paid)}'),
            Text('${EmcapLocale.t('procurement.balance.due')}: ${fmt(summary.balance)}'),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderLineTile(Map<String, dynamic> line) {
    final locale = EmcapLocale.locale.value.languageCode;
    final qty = widget.entityCode == 'PURCHASE_ORDER'
        ? purchaseOrderLineQuantity(line)
        : salesOrderLineQuantity(line);
    final price = widget.entityCode == 'PURCHASE_ORDER'
        ? purchaseOrderLineUnitPrice(line)
        : salesOrderLineUnitPrice(line);
    final priceLabel = formatRecordFieldValue(
      'unit_price',
      'currency',
      price,
      locale: locale,
      currencyCode: 'USD',
    );
    return ListTile(
      dense: true,
      title: Text('${EmcapLocale.t('entity.movementLineProduct')}: ${line['product_id'] ?? ''}'),
      subtitle: Text(
        '${EmcapLocale.t('entity.movementLineQty')}: $qty · ${EmcapLocale.t('entity.priceLine')} $priceLabel',
      ),
    );
  }

  bool _canStartWorkflow() {
    return _workflowEnabled &&
        entityStartWorkflowCode(widget.entityCode) != null &&
        _canDeleteRecord();
  }

  bool _showWorkflowSection() {
    return _workflowEnabled && entityStartWorkflowCode(widget.entityCode) != null;
  }

  Future<void> _loadWorkflowInstances(String recordId) async {
    try {
      final instances = await widget.client.listWorkflowInstances(recordId: recordId);
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() => _workflowInstances = instances);
    } catch (_) {
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() => _workflowInstances = []);
    }
  }

  Future<void> _loadRecord(String recordId) async {
    setState(() {
      _selectedRecordId = recordId;
      _creatingNew = false;
      _recordLoaded = false;
      _loadingDetail = true;
      _selectedNotes = [];
      _selectedDocuments = [];
      _selectedAudit = [];
      _workflowInstances = [];
      _movementLines = [];
      _movementLinesError = null;
      _postMovementError = null;
      _orderLines = [];
      _orderLinesError = null;
      _receivePoError = null;
      _editingId = null;
    });
    try {
      final record = await widget.client.getRecord(widget.entityCode, recordId);
      final notes = await widget.client.listNotes(widget.entityCode, recordId);
      final documents = await widget.client.listDocuments(widget.entityCode, recordId);
      final auditAll = await widget.client.listAudit(widget.entityCode);
      final audit = auditAll.where((e) => '${e['record_id']}' == recordId).toList();
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() {
        _recordValues = Map<String, dynamic>.from(record);
        _selectedNotes = notes;
        _selectedDocuments = documents;
        _selectedAudit = audit;
      });
      if (_showWorkflowSection()) {
        await _loadWorkflowInstances(recordId);
      }
      if (widget.entityCode == 'STOCK_MOVEMENT') {
        await _loadMovementLines(recordId);
      }
      if (_showOrderLinesSection()) {
        await _loadOrderLines(recordId);
      }
    } catch (err) {
      if (!mounted || _selectedRecordId != recordId) return;
      setState(() => _createError = err.toString());
    } finally {
      if (mounted && _selectedRecordId == recordId) {
        setState(() {
          _loadingDetail = false;
          _recordLoaded = true;
        });
      }
    }
  }

  bool get _waitingForRecord =>
      _selectedRecordId != null && !_creatingNew && !_recordLoaded && _createError == null;

  Widget _buildSystemSection(
    DynamicFormRenderer renderer,
    Map<String, dynamic> values, {
    bool forceReadOnly = false,
  }) {
    final systemNames = renderer.sectionFieldNames('system');
    final visible = systemNames.where((name) => renderer.isVisible(name, values)).toList();
    if (visible.isEmpty) {
      return const SizedBox.shrink();
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text(renderer.sectionLabel('system'), style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        ...visible.map((name) => _fieldInput(renderer, name, values, forceReadOnly: forceReadOnly)),
      ],
    );
  }

  String _appBarTitle(FormMetadata formMeta) {
    if (_creatingNew) {
      return '${widget.title} · ${EmcapLocale.t('entity.new')}';
    }
    if (_selectedRecordId != null) {
      return _recordHeadlineView(formMeta).headline;
    }
    return widget.title;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<FormMetadata>(
      future: _formFuture,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            appBar: AppBar(leading: BackButton(onPressed: _popToList)),
            body: Center(child: Text('${EmcapLocale.t('entity.loadFailed')}: ${snapshot.error}')),
          );
        }
        if (!snapshot.hasData) {
          return Scaffold(
            appBar: AppBar(leading: BackButton(onPressed: _popToList)),
            body: Semantics(
              label: EmcapLocale.t('a11y.screenReader.loading'),
              liveRegion: true,
              child: const Center(child: CircularProgressIndicator()),
            ),
          );
        }
        final formMeta = snapshot.data!;
        if (!formMeta.isValid) {
          return Scaffold(
            appBar: AppBar(leading: BackButton(onPressed: _popToList)),
            body: Center(child: Text(EmcapLocale.t('entity.invalidMetadata'))),
          );
        }
        final formRenderer = DynamicFormRenderer(formMeta, locale: EmcapLocale.locale.value.languageCode);
        final visibleFields = _visibleFieldNames(formRenderer);
        final formValues = _formValues(formRenderer);
        final headlineView = _recordHeadlineView(formMeta);
        final statusLabel = headlineView.statusLabel;
        final statusActive = headlineView.statusActive;

        if (_waitingForRecord) {
          return Scaffold(
            appBar: AppBar(
              leading: BackButton(onPressed: _popToList),
              title: Text(_appBarTitle(formMeta), overflow: TextOverflow.ellipsis),
            ),
            body: Semantics(
              label: EmcapLocale.t('a11y.screenReader.loading'),
              liveRegion: true,
              child: const Center(child: CircularProgressIndicator()),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            leading: BackButton(onPressed: _popToList),
            title: Text(_appBarTitle(formMeta), overflow: TextOverflow.ellipsis),
          ),
          body: Semantics(
            label: EmcapLocale.t('a11y.landmark.main'),
            child: ListView(
              padding: EdgeInsets.all(context.emcapTokens.spaceMd),
              children: [
              if (_selectedRecordId != null && !_creatingNew) ...[
                if (isRecordDeleted(_recordValues))
                  Container(
                    width: double.infinity,
                    margin: EdgeInsets.only(bottom: context.emcapTokens.spaceSm),
                    padding: EdgeInsets.all(context.emcapTokens.spaceSm),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(context.emcapTokens.radiusSm),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.onErrorContainer),
                        SizedBox(width: context.emcapTokens.spaceSm),
                        Expanded(
                          child: Text(
                            '${EmcapLocale.t('entity.record')} · ${_recordValues['deleted_at'] ?? ''}',
                            style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                          ),
                        ),
                        if (_canRestoreRecord())
                          TextButton(
                            onPressed: () => _restoreRecord(_selectedRecordId!),
                            child: Text(EmcapLocale.t('entity.restore')),
                          ),
                      ],
                    ),
                  ),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            headlineView.headline,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontSize: context.emcapTokens.fontTitleMd,
                                ),
                          ),
                          if (headlineView.subtitle.isNotEmpty &&
                              headlineView.subtitle != _selectedRecordId)
                            Padding(
                              padding: EdgeInsets.only(top: context.emcapTokens.spaceXs),
                              child: Text(
                                headlineView.subtitle,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: context.emcapTokens.textMuted,
                                    ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (statusLabel.isNotEmpty)
                      EmcapStatusChip(label: statusLabel, active: statusActive),
                  ],
                ),
                Row(
                  children: [
                    if (_canDeleteRecord())
                      TextButton(onPressed: () => _startEdit(_selectedRecordId!), child: Text(EmcapLocale.t('entity.edit'))),
                    if (_canDeleteRecord())
                      TextButton(onPressed: () => _deleteRecord(_selectedRecordId!), child: Text(EmcapLocale.t('entity.delete'))),
                    if (_canRestoreRecord())
                      TextButton(onPressed: () => _restoreRecord(_selectedRecordId!), child: Text(EmcapLocale.t('entity.restore'))),
                    if (_canPostMovement())
                      TextButton(
                        onPressed: _postingMovement ? null : _postMovement,
                        child: _postingMovement
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                            : Text(EmcapLocale.t('entity.postMovement')),
                      ),
                    if (_canReceivePurchaseOrder())
                      TextButton(
                        onPressed: _receivingPo ? null : _receivePurchaseOrder,
                        child: _receivingPo
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                            : Text(EmcapLocale.t('procurement.po.receive')),
                      ),
                    if (_canRecordVendorPayment())
                      TextButton(
                        onPressed: _recordVendorPayment,
                        child: Text(EmcapLocale.t('procurement.payment.record')),
                      ),
                    if (_canCollectCustomerPayment())
                      TextButton(
                        onPressed: _collectCustomerPayment,
                        child: Text(EmcapLocale.t('sales.invoice.collect')),
                      ),
                    if (_canAddOrderLine())
                      TextButton(
                        onPressed: _addOrderLine,
                        child: Text(EmcapLocale.t('entity.addLine')),
                      ),
                    if (_canStartWorkflow())
                      TextButton(
                        onPressed: () async {
                          final workflowCode = entityStartWorkflowCode(widget.entityCode)!;
                          await widget.client.startWorkflow(workflowCode, _selectedRecordId!);
                          if (!context.mounted) return;
                          await _loadWorkflowInstances(_selectedRecordId!);
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(EmcapLocale.t('entity.workflowStarted'))),
                          );
                        },
                        child: Text(EmcapLocale.t('entity.startWorkflow')),
                      ),
                  ],
                ),
                if (_postMovementError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(_postMovementError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ),
                if (_receivePoError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(_receivePoError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ),
                if (_loadingDetail)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: LinearProgressIndicator(),
                  )
                else ...[
                  Text(formRenderer.sectionLabel('main'), style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  ...formRenderer.layoutRows(visibleFields).map(
                    (rowNames) => Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final name in rowNames)
                          Expanded(
                            flex: formRenderer.layoutSpan(name),
                            child: Padding(
                              padding: const EdgeInsets.only(right: 8, bottom: 8),
                              child: _fieldInput(formRenderer, name, _recordValues, forceReadOnly: true),
                            ),
                          ),
                      ],
                    ),
                  ),
                  _buildSystemSection(formRenderer, _recordValues, forceReadOnly: true),
                  if (showPaymentSummaryCard(widget.entityCode)) _buildPaymentSummaryCard(),
                  if (_showOrderLinesSection()) ...[
                    const Divider(),
                    Text(_orderLinesTitle(), style: Theme.of(context).textTheme.titleSmall),
                    if (_orderLinesError != null)
                      Text(_orderLinesError!, style: TextStyle(color: Theme.of(context).colorScheme.error))
                    else if (_orderLines.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(_orderLinesEmptyLabel()),
                      )
                    else
                      ..._orderLines.map(_buildOrderLineTile),
                  ],
                  if (widget.entityCode == 'STOCK_MOVEMENT') ...[
                    const Divider(),
                    Text(EmcapLocale.t('entity.movementLinesTitle'), style: Theme.of(context).textTheme.titleSmall),
                    if (_movementLinesError != null)
                      Text(_movementLinesError!, style: TextStyle(color: Theme.of(context).colorScheme.error))
                    else if (_movementLines.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(EmcapLocale.t('entity.movementLinesEmpty')),
                      )
                    else
                      ..._movementLines.map(
                        (line) => ListTile(
                          dense: true,
                          title: Text('${EmcapLocale.t('entity.movementLineProduct')}: ${line['product_id'] ?? ''}'),
                          subtitle: Text('${EmcapLocale.t('entity.movementLineQty')}: ${line['quantity'] ?? ''}'),
                        ),
                      ),
                  ],
                  const Divider(),
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
                          if (!context.mounted) return;
                          await showDocumentPreviewDialog(
                            context,
                            client: widget.client,
                            documentId: '${doc['id']}',
                            initialDocument: doc,
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
                  if (_showWorkflowSection()) ...[
                    Text('${EmcapLocale.t('record.workflow')} (${_workflowInstances.length})'),
                    if (_workflowInstances.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(EmcapLocale.t('record.noWorkflowInstances')),
                      )
                    else
                      ..._workflowInstances.map(
                        (instance) => ListTile(
                          dense: true,
                          title: Text('${instance['workflow_code']}'),
                          subtitle: Text('${instance['current_state']} · ${instance['assignee'] ?? ''}'),
                        ),
                      ),
                    if (widget.onOpenWorkflowInbox != null)
                      TextButton(
                        onPressed: () {
                          Navigator.of(context, rootNavigator: true).pop(_listChanged);
                          widget.onOpenWorkflowInbox!();
                        },
                        child: Text(EmcapLocale.t('record.openInbox')),
                      ),
                  ],
                  TextField(
                    controller: _docFilename,
                    decoration: InputDecoration(labelText: EmcapLocale.t('record.docFilename')),
                  ),
                  TextField(
                    controller: _docContent,
                    decoration: InputDecoration(labelText: EmcapLocale.t('record.docContent')),
                  ),
                  TextButton(
                    onPressed: () async {
                      await widget.client.uploadDocument(
                        widget.entityCode,
                        _selectedRecordId!,
                        _docFilename.text,
                        _docContent.text,
                      );
                      _listChanged = true;
                      await _loadRecord(_selectedRecordId!);
                    },
                    child: Text(EmcapLocale.t('record.uploadDocument')),
                  ),
                ],
              ] else if (_creatingNew) ...[
                Text(headlineView.headline, style: Theme.of(context).textTheme.titleMedium),
              ],
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
                            child: _fieldInput(formRenderer, name, formValues),
                          ),
                        ),
                    ],
                  ),
                ),
                if (_editingId != null) _buildSystemSection(formRenderer, _recordValues),
                if (_creatingNew)
                  TextField(
                    controller: _noteController,
                    decoration: InputDecoration(labelText: EmcapLocale.t('entity.noteOptional')),
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
                    child: Text(EmcapLocale.t('entity.cancel')),
                  ),
                ElevatedButton(
                  onPressed: _creating ? null : _saveRecord,
                  child: _creating
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(
                          _editingId != null || _creatingNew
                              ? EmcapLocale.t('entity.save')
                              : EmcapLocale.t('entity.createRecord'),
                        ),
                ),
              ],
            ],
          ),
          ),
        );
      },
    );
  }
}
