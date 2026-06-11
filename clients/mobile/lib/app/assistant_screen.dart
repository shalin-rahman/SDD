import 'package:flutter/material.dart';

import '../api/emcap_client.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key, required this.client, required this.enabled});

  final EmcapClient client;
  final bool enabled;

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final _message = TextEditingController(text: 'Summarize inventory status');
  String? _response;
  String? _error;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assistant')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: widget.enabled
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _message,
                    decoration: const InputDecoration(labelText: 'Message'),
                    maxLines: 3,
                  ),
                  if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ElevatedButton(
                    onPressed: () async {
                      setState(() {
                        _error = null;
                        _response = null;
                      });
                      try {
                        final result = await widget.client.aiChat(_message.text);
                        setState(() => _response = '${result['reply'] ?? result}');
                      } catch (err) {
                        setState(() => _error = err.toString());
                      }
                    },
                    child: const Text('Send'),
                  ),
                  if (_response != null) Expanded(child: SingleChildScrollView(child: Text(_response!))),
                ],
              )
            : const Center(child: Text('AI disabled in platform config.')),
      ),
    );
  }
}
