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
  int _mfaStep = 1;
  String? _mfaError;

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
              _MfaStepIndicator(activeStep: _mfaStep),
              if (_mfaError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_mfaError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              if (_mfaSecret != null)
                Text('${EmcapLocale.t('platform.account.mfaSecret')}: $_mfaSecret'),
              if (_mfaStep >= 2)
                TextField(
                  controller: _mfaCode,
                  decoration: InputDecoration(labelText: EmcapLocale.t('platform.account.totpCode')),
                ),
              Row(
                children: [
                  TextButton(
                    onPressed: () async {
                      setState(() {
                        _mfaError = null;
                      });
                      try {
                        final result = await widget.client.enrollMfa();
                        setState(() {
                          _mfaSecret = '${result['secret']}';
                          _mfaStep = 2;
                        });
                      } catch (err) {
                        if (!mounted) return;
                        setState(() => _mfaError = EmcapLocale.t('platform.account.mfaEnrollFailed'));
                      }
                    },
                    child: Text(EmcapLocale.t('platform.account.enrollMfa')),
                  ),
                  if (_mfaStep >= 2)
                    TextButton(
                      onPressed: () async {
                        setState(() => _mfaError = null);
                        try {
                          final result = await widget.client.verifyMfa(_mfaCode.text);
                          widget.client.setToken(
                            result['access_token'] as String,
                            widget.client.getTenantId(),
                          );
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(EmcapLocale.t('platform.account.mfaVerified'))),
                          );
                        } catch (err) {
                          if (!mounted) return;
                          setState(() => _mfaError = EmcapLocale.t('platform.account.mfaVerifyFailed'));
                        }
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

class _MfaStepIndicator extends StatelessWidget {
  const _MfaStepIndicator({required this.activeStep});

  final int activeStep;

  @override
  Widget build(BuildContext context) {
    final steps = [
      EmcapLocale.t('platform.account.mfaStep1'),
      EmcapLocale.t('platform.account.mfaStep2'),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < steps.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${i + 1}.',
                    style: TextStyle(
                      fontWeight: activeStep == i + 1 ? FontWeight.bold : FontWeight.normal,
                      color: activeStep == i + 1
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      steps[i],
                      style: TextStyle(
                        fontWeight: activeStep == i + 1 ? FontWeight.w600 : FontWeight.normal,
                        color: activeStep == i + 1
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
