import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';
import '../utils/field_display.dart';
import '../utils/workflow_detail_util.dart';
import '../utils/workflow_sla_util.dart';
import '../utils/workflow_state_util.dart';

class WorkflowInboxScreen extends StatefulWidget {
  const WorkflowInboxScreen({
    super.key,
    required this.client,
    this.onOpenEntity,
  });

  final EmcapClient client;
  final void Function(String entityCode)? onOpenEntity;

  @override
  State<WorkflowInboxScreen> createState() => _WorkflowInboxScreenState();
}

class _WorkflowInboxScreenState extends State<WorkflowInboxScreen> {
  List<Map<String, dynamic>> _instances = [];
  bool _loading = true;
  String? _error;
  String? _escalateMsg;
  String? _busyId;
  String _stateFilter = '';
  String _assigneeFilter = '';
  Map<String, dynamic>? _detailPayload;

  @override
  void initState() {
    super.initState();
    EmcapLocale.locale.addListener(_onLocaleChanged);
    _reload();
  }

  @override
  void dispose() {
    EmcapLocale.locale.removeListener(_onLocaleChanged);
    super.dispose();
  }

  void _onLocaleChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final instances = await widget.client.listWorkflowInstances();
      if (!mounted) return;
      setState(() {
        _instances = instances;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = EmcapLocale.t('platform.workflow.loadFailed');
        _loading = false;
        _instances = [];
      });
    }
  }

  List<Map<String, dynamic>> get _filteredInstances {
    return _instances.where((item) {
      final state = '${item['current_state'] ?? ''}';
      final assignee = '${item['assignee'] ?? ''}';
      if (_stateFilter.isNotEmpty && state != _stateFilter) return false;
      if (_assigneeFilter.isNotEmpty && assignee != _assigneeFilter) return false;
      return true;
    }).toList();
  }

  List<String> get _stateOptions {
    return _instances.map((i) => '${i['current_state'] ?? ''}').where((s) => s.isNotEmpty).toSet().toList()..sort();
  }

  List<String> get _assigneeOptions {
    return _instances.map((i) => '${i['assignee'] ?? ''}').where((s) => s.isNotEmpty).toSet().toList()..sort();
  }

  Future<void> _escalate() async {
    try {
      final result = await widget.client.escalateWorkflows();
      if (!mounted) return;
      setState(() {
        _escalateMsg = '${EmcapLocale.t('platform.workflow.escalated')}: ${result['escalated'] ?? 0}';
      });
      await _reload();
    } catch (err) {
      if (!mounted) return;
      setState(() => _error = err.toString());
    }
  }

  Future<bool> _confirmTransition(String action) async {
    final label = workflowActionLabel(action);
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(EmcapLocale.t('platform.workflow.confirmTransition')),
        content: Text('$label?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(EmcapLocale.t('common.cancel'))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(label)),
        ],
      ),
    );
    return result == true;
  }

  Future<void> _transition(String instanceId, String action) async {
    if (!await _confirmTransition(action)) return;
    setState(() {
      _busyId = instanceId;
      _error = null;
    });
    try {
      await widget.client.transitionWorkflow(instanceId, action, 'admin');
      await _reload();
    } catch (err) {
      setState(() => _error = err.toString());
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Future<void> _delegate(String instanceId) async {
    final delegateTo = await showDialog<String>(
      context: context,
      builder: (context) {
        final controller = TextEditingController(text: 'inventory-manager');
        return AlertDialog(
          title: Text(EmcapLocale.t('platform.workflow.delegatePrompt')),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(labelText: EmcapLocale.t('platform.workflow.colAssignee')),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: Text(EmcapLocale.t('common.cancel'))),
            TextButton(onPressed: () => Navigator.pop(context, controller.text), child: Text(EmcapLocale.t('common.save'))),
          ],
        );
      },
    );
    if (delegateTo == null || delegateTo.isEmpty) return;
    setState(() {
      _busyId = instanceId;
      _error = null;
    });
    try {
      await widget.client.delegateWorkflow(instanceId, delegateTo.trim());
      await _reload();
    } catch (err) {
      setState(() => _error = err.toString());
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Future<void> _showDetail(String instanceId) async {
    try {
      final detail = await widget.client.getWorkflowInstance(instanceId);
      if (!mounted) return;
      setState(() => _detailPayload = detail);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = EmcapLocale.t('platform.workflow.loadFailed'));
    }
  }

  void _closeDetail() {
    setState(() => _detailPayload = null);
  }

  void _openEntity(String entityCode) {
    widget.onOpenEntity?.call(entityCode);
  }

  void _openProducts() {
    _openEntity('PRODUCT');
  }

  List<Widget> _actionsFor(String state, String instanceId) {
    final busy = _busyId == instanceId;
    final widgets = <Widget>[
      TextButton(
        onPressed: busy ? null : () => _showDetail(instanceId),
        child: Text(EmcapLocale.t('platform.workflow.detail')),
      ),
    ];
    for (final action in workflowRowActions(state)) {
      widgets.add(
        TextButton(
          onPressed: busy ? null : () => _transition(instanceId, action),
          child: Text(workflowActionLabel(action)),
        ),
      );
    }
    if (workflowCanDelegate(state)) {
      widgets.add(
        TextButton(
          onPressed: busy ? null : () => _delegate(instanceId),
          child: Text(EmcapLocale.t('platform.workflow.delegate')),
        ),
      );
    }
    return widgets;
  }

  String _slaLabel(String? dueAt) {
    switch (workflowSlaLevel(dueAt)) {
      case WorkflowSlaLevel.overdue:
        return EmcapLocale.t('platform.workflow.slaOverdue');
      case WorkflowSlaLevel.warning:
        return EmcapLocale.t('platform.workflow.slaDueSoon');
      case WorkflowSlaLevel.ok:
        return EmcapLocale.t('platform.workflow.slaOnTrack');
      case WorkflowSlaLevel.none:
        return '';
    }
  }

  Color? _slaColor(String? dueAt) {
    switch (workflowSlaLevel(dueAt)) {
      case WorkflowSlaLevel.overdue:
        return Colors.red.shade100;
      case WorkflowSlaLevel.warning:
        return Colors.orange.shade100;
      case WorkflowSlaLevel.ok:
        return Colors.green.shade100;
      case WorkflowSlaLevel.none:
        return null;
    }
  }

  String _formatDue(dynamic dueAt, dynamic slaHours) {
    if (dueAt != null && '$dueAt'.isNotEmpty) {
      return formatRecordFieldValue('due_at', 'datetime', dueAt, locale: EmcapLocale.locale.value.languageCode);
    }
    if (slaHours != null) return '${slaHours}h SLA';
    return '—';
  }

  Widget _emptyState() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(EmcapLocale.t('platform.workflow.noInstances')),
        if (widget.onOpenEntity != null)
          TextButton(
            onPressed: _openProducts,
            child: Text(EmcapLocale.t('platform.workflow.openProducts')),
          ),
      ],
    );
  }

  Widget _detailPanel() {
    if (_detailPayload == null) return const SizedBox.shrink();
    final entries = workflowDetailEntries(
      _detailPayload!,
      locale: EmcapLocale.locale.value.languageCode,
    );
    return Card(
      margin: const EdgeInsets.only(top: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(EmcapLocale.t('platform.workflow.detailTitle'), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 120, child: Text(entry.label, style: Theme.of(context).textTheme.labelMedium)),
                    Expanded(child: Text(entry.value)),
                  ],
                ),
              ),
            ),
            TextButton(onPressed: _closeDetail, child: Text(EmcapLocale.t('common.cancel'))),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(EmcapLocale.t('platform.workflow.title')),
        actions: [
          TextButton(onPressed: _loading ? null : _escalate, child: Text(EmcapLocale.t('platform.workflow.escalate'))),
          IconButton(onPressed: _reload, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? Center(child: Text(EmcapLocale.t('common.loading')))
          : _error != null && _instances.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      TextButton(onPressed: _reload, child: Text(EmcapLocale.t('common.retry'))),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      ),
                    if (_escalateMsg != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(_escalateMsg!),
                      ),
                    if (_instances.isEmpty)
                      _emptyState()
                    else ...[
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _stateFilter.isEmpty ? null : _stateFilter,
                              decoration: InputDecoration(labelText: EmcapLocale.t('platform.workflow.filterState')),
                              items: [
                                DropdownMenuItem(value: '', child: Text(EmcapLocale.t('platform.workflow.filterAll'))),
                                ..._stateOptions.map((s) => DropdownMenuItem(value: s, child: Text(workflowStateLabel(s)))),
                              ],
                              onChanged: (v) => setState(() => _stateFilter = v ?? ''),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _assigneeFilter.isEmpty ? null : _assigneeFilter,
                              decoration: InputDecoration(labelText: EmcapLocale.t('platform.workflow.filterAssignee')),
                              items: [
                                DropdownMenuItem(value: '', child: Text(EmcapLocale.t('platform.workflow.filterAll'))),
                                ..._assigneeOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))),
                              ],
                              onChanged: (v) => setState(() => _assigneeFilter = v ?? ''),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_filteredInstances.isEmpty) Text(EmcapLocale.t('platform.workflow.noMatches')),
                      ..._filteredInstances.map((item) {
                        final id = '${item['id']}';
                        final state = '${item['current_state']}';
                        final entityCode = '${item['entity_code']}';
                        final recordId = '${item['record_id']}';
                        final dueAt = item['due_at']?.toString();
                        final slaLabel = _slaLabel(dueAt);
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${item['workflow_code']}',
                                        style: Theme.of(context).textTheme.titleMedium,
                                      ),
                                    ),
                                    Chip(
                                      label: Text(workflowStateLabel(state), style: const TextStyle(fontSize: 11)),
                                      visualDensity: VisualDensity.compact,
                                    ),
                                  ],
                                ),
                                if (widget.onOpenEntity != null)
                                  TextButton(
                                    style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    onPressed: () => _openEntity(entityCode),
                                    child: Text('$entityCode · $recordId'),
                                  )
                                else
                                  Text('$entityCode · $recordId'),
                                if (item['assignee'] != null)
                                  Text('${EmcapLocale.t('platform.workflow.colAssignee')}: ${item['assignee']}'),
                                Row(
                                  children: [
                                    Text('${EmcapLocale.t('platform.workflow.colDueAt')}: ${_formatDue(item['due_at'], item['sla_hours'])}'),
                                    if (slaLabel.isNotEmpty) ...[
                                      const SizedBox(width: 8),
                                      Chip(
                                        label: Text(slaLabel, style: const TextStyle(fontSize: 11)),
                                        backgroundColor: _slaColor(dueAt),
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    ],
                                  ],
                                ),
                                Wrap(spacing: 4, children: _actionsFor(state, id)),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                    _detailPanel(),
                  ],
                ),
    );
  }
}
