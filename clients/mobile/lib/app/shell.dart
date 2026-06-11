import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import 'account_screen.dart';
import 'dashboard_screen.dart';
import 'entity_screen.dart';
import 'notification_screen.dart';
import 'report_screen.dart';
import 'workflow_inbox_screen.dart';

const _fixedDestinations = 5;

class EmcapShell extends StatefulWidget {
  const EmcapShell({super.key, required this.client});

  final EmcapClient client;

  @override
  State<EmcapShell> createState() => _EmcapShellState();
}

class _EmcapShellState extends State<EmcapShell> {
  List<Map<String, dynamic>> menus = [];
  int selected = 0;
  String _tenantLabel = '';

  @override
  void initState() {
    super.initState();
    _loadMenus();
    _loadTenant();
  }

  Future<void> _loadTenant() async {
    try {
      final health = await widget.client.getHealth();
      if (!mounted) return;
      setState(() {
        _tenantLabel = 'tenant · ${health['tenant_strategy']} · multi=${health['multi_tenant']}';
      });
    } catch (_) {}
  }

  Future<void> _loadMenus() async {
    final loaded = await widget.client.getMenus();
    setState(() {
      menus = loaded;
      selected = loaded.isEmpty ? 0 : _fixedDestinations;
    });
  }

  Widget _bodyForSelection() {
    switch (selected) {
      case 0:
        return WorkflowInboxScreen(client: widget.client);
      case 1:
        return ReportScreen(client: widget.client);
      case 2:
        return DashboardScreen(client: widget.client);
      case 3:
        return NotificationScreen(client: widget.client);
      case 4:
        return AccountScreen(client: widget.client);
      default:
        final menu = menus[selected - _fixedDestinations];
        return EntityScreen(
          client: widget.client,
          entityCode: menu['entity_code'] as String,
          title: menu['label'] as String,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (menus.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: selected,
            onDestinationSelected: (index) => setState(() => selected = index),
            labelType: NavigationRailLabelType.all,
            destinations: [
              const NavigationRailDestination(icon: Icon(Icons.inbox), label: Text('Tasks')),
              const NavigationRailDestination(icon: Icon(Icons.assessment), label: Text('Reports')),
              const NavigationRailDestination(icon: Icon(Icons.dashboard), label: Text('Boards')),
              const NavigationRailDestination(icon: Icon(Icons.notifications), label: Text('Notify')),
              const NavigationRailDestination(icon: Icon(Icons.person), label: Text('Account')),
              ...menus.map(
                (item) => NavigationRailDestination(
                  icon: const Icon(Icons.folder),
                  label: Text(item['label'] as String),
                ),
              ),
            ],
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_tenantLabel.isNotEmpty)
                  Material(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      child: Text(_tenantLabel, style: Theme.of(context).textTheme.bodySmall),
                    ),
                  ),
                Expanded(child: _bodyForSelection()),
              ],
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
