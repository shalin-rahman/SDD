import 'package:flutter/material.dart';

import '../api/emcap_client.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  late Future<_AccountData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_AccountData> _load() async {
    final health = await widget.client.getHealth();
    final tenants = await widget.client.listTenants();
    final permissions = await widget.client.getPermissions();
    final roles = await widget.client.getRoles();
    final config = await widget.client.getPlatformConfig();
    final modules = config['modules'] as Map<String, dynamic>? ?? {};
    final paymentsEnabled = (modules['payments'] as Map?)?['enabled'] == true;
    return _AccountData(
      health: health,
      tenants: tenants,
      permissions: permissions,
      roles: roles,
      paymentsEnabled: paymentsEnabled,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: FutureBuilder<_AccountData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Failed: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final data = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Tenant mode: ${data.health['multi_tenant']} · ${data.health['tenant_strategy']}'),
              if (data.tenants['white_label'] == true) const Text('White-label enabled'),
              const SizedBox(height: 12),
              Text('Permissions (${data.permissions.length})', style: Theme.of(context).textTheme.titleMedium),
              ...data.permissions.take(20).map((p) => ListTile(dense: true, title: Text(p))),
              const SizedBox(height: 12),
              Text('Roles (${data.roles.length})', style: Theme.of(context).textTheme.titleMedium),
              ...data.roles.map((r) => ListTile(dense: true, title: Text('${r['code'] ?? r['name'] ?? r}'))),
              const SizedBox(height: 12),
              const Text('Integrations', style: TextStyle(fontWeight: FontWeight.bold)),
              const ListTile(dense: true, title: Text('REST dispatch — POST /api/v1/integrations/rest/dispatch')),
              const ListTile(dense: true, title: Text('Kafka publish — POST /api/v1/integrations/kafka/publish')),
              if (data.paymentsEnabled) ...[
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      final result = await widget.client.createPaymentIntent('10.00');
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Intent: ${result['id'] ?? result}')),
                      );
                    } catch (err) {
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$err')));
                    }
                  },
                  child: const Text('Create payment intent (demo)'),
                ),
              ] else
                const Text('Payments disabled in platform config'),
            ],
          );
        },
      ),
    );
  }
}

class _AccountData {
  _AccountData({
    required this.health,
    required this.tenants,
    required this.permissions,
    required this.roles,
    required this.paymentsEnabled,
  });

  final Map<String, dynamic> health;
  final Map<String, dynamic> tenants;
  final List<String> permissions;
  final List<Map<String, dynamic>> roles;
  final bool paymentsEnabled;
}
