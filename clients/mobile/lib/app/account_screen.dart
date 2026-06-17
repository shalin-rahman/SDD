import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  late Future<_AccountData> _future;
  final _mfaCode = TextEditingController();
  String? _mfaSecret;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _mfaCode.dispose();
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
      appBar: AppBar(title: Text(EmcapLocale.t('platform.account.title'))),
      body: FutureBuilder<_AccountData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Text('${EmcapLocale.t('platform.common.failed')}: ${snapshot.error}'),
            );
          }
          if (!snapshot.hasData) {
            return Center(child: Text(EmcapLocale.t('common.loading')));
          }
          final data = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                '${EmcapLocale.t('platform.account.tenantMode')}: ${data.health['multi_tenant']} · ${data.health['tenant_strategy']}',
              ),
              if (data.tenants['white_label'] == true)
                Text(EmcapLocale.t('platform.account.whiteLabelEnabled')),
              const SizedBox(height: 12),
              Text(EmcapLocale.t('platform.account.mfa'), style: Theme.of(context).textTheme.titleMedium),
              if (_mfaSecret != null)
                Text('${EmcapLocale.t('platform.account.mfaSecret')}: $_mfaSecret'),
              TextField(
                controller: _mfaCode,
                decoration: InputDecoration(labelText: EmcapLocale.t('platform.account.totpCode')),
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: () async {
                      final result = await widget.client.enrollMfa();
                      setState(() => _mfaSecret = '${result['secret']}');
                    },
                    child: Text(EmcapLocale.t('platform.account.enrollMfa')),
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
                        SnackBar(content: Text(EmcapLocale.t('platform.account.mfaVerified'))),
                      );
                    },
                    child: Text(EmcapLocale.t('platform.account.verifyMfa')),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${EmcapLocale.t('platform.account.permissions')} (${data.permissions.length})',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              ...data.permissions.take(20).map((p) => ListTile(dense: true, title: Text(p))),
              const SizedBox(height: 12),
              Text(
                '${EmcapLocale.t('platform.account.roles')} (${data.roles.length})',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              ...data.roles.map((r) => ListTile(dense: true, title: Text('${r['code'] ?? r['name'] ?? r}'))),
              const SizedBox(height: 12),
              Text(
                EmcapLocale.t('platform.account.integrationsMoved'),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Text(EmcapLocale.t('platform.account.admin'), style: const TextStyle(fontWeight: FontWeight.bold)),
              FutureBuilder<Map<String, dynamic>>(
                future: widget.client.getMe(),
                builder: (context, meSnap) {
                  if (!meSnap.hasData) return const SizedBox.shrink();
                  return Text(
                    '${EmcapLocale.t('platform.account.user')}: ${meSnap.data!['user_id'] ?? meSnap.data}',
                  );
                },
              ),
              ElevatedButton(
                onPressed: () async {
                  final result = await widget.client.checkAuth('inventory.access');
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${EmcapLocale.t('platform.account.allowed')}: ${result['allowed']}'),
                    ),
                  );
                },
                child: Text(EmcapLocale.t('platform.account.checkInventory')),
              ),
              ElevatedButton(
                onPressed: () async {
                  final text = await widget.client.getMetrics();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(text.length > 80 ? text.substring(0, 80) : text)),
                  );
                },
                child: Text(EmcapLocale.t('platform.account.fetchMetrics')),
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
                        SnackBar(content: Text('${EmcapLocale.t('platform.account.paymentConfirmed')}: $txnId')),
                      );
                    } catch (err) {
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$err')));
                    }
                  },
                  child: Text(EmcapLocale.t('platform.account.createPayment')),
                ),
              ] else
                Text(EmcapLocale.t('platform.account.paymentsDisabled')),
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
