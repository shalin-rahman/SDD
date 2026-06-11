import 'dart:convert';

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
  final _mfaCode = TextEditingController();
  final _dispatchUrl = TextEditingController(text: 'https://httpbin.org/post');
  final _dispatchPayload = TextEditingController(text: '{"ping":true}');
  String? _mfaSecret;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _mfaCode.dispose();
    _dispatchUrl.dispose();
    _dispatchPayload.dispose();
    super.dispose();
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
              Text('MFA', style: Theme.of(context).textTheme.titleMedium),
              if (_mfaSecret != null) Text('Secret: $_mfaSecret'),
              TextField(controller: _mfaCode, decoration: const InputDecoration(labelText: 'TOTP code')),
              Row(
                children: [
                  TextButton(
                    onPressed: () async {
                      final result = await widget.client.enrollMfa();
                      setState(() => _mfaSecret = '${result['secret']}');
                    },
                    child: const Text('Enroll'),
                  ),
                  TextButton(
                    onPressed: () async {
                      final result = await widget.client.verifyMfa(_mfaCode.text);
                      widget.client.setToken(
                        result['access_token'] as String,
                        widget.client.getTenantId(),
                      );
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('MFA verified — token refreshed')),
                      );
                    },
                    child: const Text('Verify'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text('Permissions (${data.permissions.length})', style: Theme.of(context).textTheme.titleMedium),
              ...data.permissions.take(20).map((p) => ListTile(dense: true, title: Text(p))),
              const SizedBox(height: 12),
              Text('Roles (${data.roles.length})', style: Theme.of(context).textTheme.titleMedium),
              ...data.roles.map((r) => ListTile(dense: true, title: Text('${r['code'] ?? r['name'] ?? r}'))),
              const SizedBox(height: 12),
              const Text('Integrations', style: TextStyle(fontWeight: FontWeight.bold)),
              TextField(controller: _dispatchUrl, decoration: const InputDecoration(labelText: 'REST URL')),
              TextField(
                controller: _dispatchPayload,
                decoration: const InputDecoration(labelText: 'JSON payload'),
                maxLines: 2,
              ),
              ElevatedButton(
                onPressed: () async {
                  try {
                    final payload = _dispatchPayload.text.trim().isEmpty
                        ? <String, dynamic>{}
                        : Map<String, dynamic>.from(jsonDecode(_dispatchPayload.text) as Map);
                    final result = await widget.client.dispatchRestIntegration(_dispatchUrl.text, payload);
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$result')));
                  } catch (err) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$err')));
                  }
                },
                child: const Text('REST dispatch'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final result = await widget.client.publishKafkaIntegration('emcap.events', {'ping': true});
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$result')));
                },
                child: const Text('Kafka publish'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final result = await widget.client.invokeSoapIntegration(
                    'https://example.com/soap',
                    'Ping',
                    {},
                  );
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$result')));
                },
                child: const Text('SOAP invoke'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final result = await widget.client.uploadSftpIntegration(
                    'sftp.example.com',
                    '/inbound/data.json',
                    {'ok': true},
                  );
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$result')));
                },
                child: const Text('SFTP upload'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final result = await widget.client.graphqlQuery('{ health { status } }');
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$result')));
                },
                child: const Text('GraphQL health'),
              ),
              const Text('Admin', style: TextStyle(fontWeight: FontWeight.bold)),
              FutureBuilder<Map<String, dynamic>>(
                future: widget.client.getMe(),
                builder: (context, meSnap) {
                  if (!meSnap.hasData) return const SizedBox.shrink();
                  return Text('User: ${meSnap.data!['user_id'] ?? meSnap.data}');
                },
              ),
              ElevatedButton(
                onPressed: () async {
                  final result = await widget.client.checkAuth('inventory.access');
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Allowed: ${result['allowed']}')),
                  );
                },
                child: const Text('Check inventory.access'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final text = await widget.client.getMetrics();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(text.length > 80 ? text.substring(0, 80) : text)),
                  );
                },
                child: const Text('Fetch metrics'),
              ),
              if (data.paymentsEnabled) ...[
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      final result = await widget.client.createPaymentIntent('10.00');
                      final txnId = '${result['transaction_id'] ?? ''}';
                      if (txnId.isNotEmpty) {
                        await widget.client.confirmPaymentIntent(txnId);
                      }
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Payment: $txnId confirmed')),
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
