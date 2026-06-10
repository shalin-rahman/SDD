import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import 'entity_screen.dart';

class EmcapShell extends StatefulWidget {
  const EmcapShell({super.key, required this.client});

  final EmcapClient client;

  @override
  State<EmcapShell> createState() => _EmcapShellState();
}

class _EmcapShellState extends State<EmcapShell> {
  List<Map<String, dynamic>> menus = [];
  int selected = 0;

  @override
  void initState() {
    super.initState();
    _loadMenus();
  }

  Future<void> _loadMenus() async {
    final loaded = await widget.client.getMenus();
    setState(() => menus = loaded);
  }

  @override
  Widget build(BuildContext context) {
    if (menus.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final menu = menus[selected];
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: selected,
            onDestinationSelected: (index) => setState(() => selected = index),
            labelType: NavigationRailLabelType.all,
            destinations: menus
                .map(
                  (item) => NavigationRailDestination(
                    icon: const Icon(Icons.folder),
                    label: Text(item['label'] as String),
                  ),
                )
                .toList(),
          ),
          Expanded(
            child: EntityScreen(
              client: widget.client,
              entityCode: menu['entity_code'] as String,
              title: menu['label'] as String,
            ),
          ),
        ],
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _username = TextEditingController(text: 'admin');
  final _password = TextEditingController(text: 'admin123');
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('EMCAP Mobile')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(controller: _username, decoration: const InputDecoration(labelText: 'Username')),
            TextField(
              controller: _password,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                try {
                  final result = await widget.client.login(_username.text, _password.text);
                  widget.client.setToken(
                    result['access_token'] as String,
                    result['tenant_id'] as String,
                  );
                  if (!context.mounted) return;
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => EmcapShell(client: widget.client)),
                  );
                } catch (err) {
                  setState(() => _error = err.toString());
                }
              },
              child: const Text('Sign in'),
            ),
          ],
        ),
      ),
    );
  }
}
