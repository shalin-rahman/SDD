import 'package:flutter/material.dart';

import '../api/emcap_client.dart';

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
          title: const Text('Delegate to'),
          content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Assignee')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('OK')),
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
        TextButton(onPressed: busy ? null : () => _transition(instanceId, 'submit'), child: const Text('Submit')),
      ];
    }
    if (state == 'submitted') {
      return [
        TextButton(onPressed: busy ? null : () => _transition(instanceId, 'approve'), child: const Text('Approve')),
        TextButton(onPressed: busy ? null : () => _transition(instanceId, 'reject'), child: const Text('Reject')),
        TextButton(onPressed: busy ? null : () => _delegate(instanceId), child: const Text('Delegate')),
      ];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Workflow tasks'),
        actions: [IconButton(onPressed: _reload, icon: const Icon(Icons.refresh))],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Failed to load: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final instances = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              if (instances.isEmpty) const Text('No open workflow instances.'),
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
                        if (item['assignee'] != null) Text('Assignee: ${item['assignee']}'),
                        if (item['due_at'] != null) Text('Due: ${item['due_at']}'),
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
