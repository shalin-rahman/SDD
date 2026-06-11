import 'package:flutter/material.dart';

import '../api/emcap_client.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  late Future<List<Map<String, dynamic>>> _future;
  final _recipient = TextEditingController(text: 'ops@example.com');
  final _subject = TextEditingController(text: 'EMCAP alert');
  final _body = TextEditingController(text: 'Stock level notification');
  String? _error;
  List<String> _channels = ['email'];
  String _selectedChannel = 'email';

  @override
  void initState() {
    super.initState();
    _future = widget.client.listNotifications();
    _loadChannels();
  }

  Future<void> _loadChannels() async {
    try {
      final config = await widget.client.getPlatformConfig();
      final notifications = config['notifications'] as Map<String, dynamic>? ?? {};
      final enabled = notifications.entries
          .where((e) => e.value == true)
          .map((e) => e.key)
          .toList();
      if (!mounted || enabled.isEmpty) return;
      setState(() {
        _channels = enabled;
        _selectedChannel = enabled.first;
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _recipient.dispose();
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() => _error = null);
    try {
      await widget.client.sendNotification(
        channel: _selectedChannel,
        recipient: _recipient.text,
        subject: _subject.text,
        body: _body.text,
      );
      setState(() => _future = widget.client.listNotifications());
    } catch (err) {
      setState(() => _error = err.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String>(
            value: _selectedChannel,
            decoration: const InputDecoration(labelText: 'Channel'),
            items: _channels.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
            onChanged: (value) {
              if (value != null) setState(() => _selectedChannel = value);
            },
          ),
          TextField(controller: _recipient, decoration: const InputDecoration(labelText: 'Recipient')),
          TextField(controller: _subject, decoration: const InputDecoration(labelText: 'Subject')),
          TextField(controller: _body, decoration: const InputDecoration(labelText: 'Body'), maxLines: 2),
          if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ElevatedButton(onPressed: _send, child: const Text('Send')),
          const SizedBox(height: 16),
          FutureBuilder<List<Map<String, dynamic>>>(
            future: _future,
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const LinearProgressIndicator();
              final items = snapshot.data!;
              if (items.isEmpty) return const Text('No notifications sent yet.');
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: items
                    .map((n) => ListTile(
                          title: Text('${n['subject'] ?? n['channel']}'),
                          subtitle: Text('${n['recipient'] ?? ''}'),
                        ))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
