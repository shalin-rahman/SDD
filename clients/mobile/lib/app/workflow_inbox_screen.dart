import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';

class WorkflowInboxScreen extends StatefulWidget {
  const WorkflowInboxScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<WorkflowInboxScreen> createState() => _WorkflowInboxScreenState();
}

class _WorkflowInboxScreenState extends State<WorkflowInboxScreen> {
  late Future<List<Map<String, dynamic>>> _future;
  String? _error;
  String? _busyId;

  @override
  void initState() {
    super.initState();
    _future = widget.client.listWorkflowInstances();
  }

  Future<void> _reload() async {
    setState(() {
      _error = null;
      _future = widget.client.listWorkflowInstances();
    });
  }

  Future<void> _transition(String instanceId, String action) async {
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
      await widget.client.delegateWorkflow(instanceId, delegateTo);
      await _reload();
    } catch (err) {
      setState(() => _error = err.toString());
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  List<Widget> _actionsFor(String state, String instanceId) {
    final busy = _busyId == instanceId;
    if (state == 'draft') {
      return [
        TextButton(
          onPressed: busy ? null : () => _transition(instanceId, 'submit'),
          child: Text(EmcapLocale.t('platform.workflow.submit')),
        ),
      ];
    }
    if (state == 'submitted') {
      return [
        TextButton(
          onPressed: busy ? null : () => _transition(instanceId, 'approve'),
          child: Text(EmcapLocale.t('platform.workflow.approve')),
        ),
        TextButton(
          onPressed: busy ? null : () => _transition(instanceId, 'reject'),
          child: Text(EmcapLocale.t('platform.workflow.reject')),
        ),
        TextButton(
          onPressed: busy ? null : () => _delegate(instanceId),
          child: Text(EmcapLocale.t('platform.workflow.delegate')),
        ),
      ];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(EmcapLocale.t('platform.workflow.title')),
        actions: [IconButton(onPressed: _reload, icon: const Icon(Icons.refresh))],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Text('${EmcapLocale.t('platform.common.failed')}: ${snapshot.error}'),
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final instances = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              if (instances.isEmpty) Text(EmcapLocale.t('platform.workflow.noInstances')),
              ...instances.map((item) {
                final id = '${item['id']}';
                final state = '${item['current_state']}';
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${item['workflow_code']} · $state', style: Theme.of(context).textTheme.titleMedium),
                        Text('${item['entity_code']} / ${item['record_id']}'),
                        if (item['assignee'] != null)
                          Text('${EmcapLocale.t('platform.workflow.colAssignee')}: ${item['assignee']}'),
                        if (item['due_at'] != null)
                          Text('${EmcapLocale.t('platform.workflow.colDueAt')}: ${item['due_at']}'),
                        Wrap(spacing: 4, children: _actionsFor(state, id)),
                      ],
                    ),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
