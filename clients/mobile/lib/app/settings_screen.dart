import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../theme/app_tokens.dart';
import '../services/i18n_service.dart';
import '../utils/document_platform_settings_util.dart';
import '../utils/security_platform_settings_util.dart';
import '../widgets/emcap_badge.dart';
import '../widgets/layout_editor_panel.dart';
import '../widgets/detail_placeholder.dart';
import '../widgets/master_detail_layout.dart';
import '../widgets/settings_toggle_group.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, required this.client, this.onNavRefresh});

  final EmcapClient client;
  final VoidCallback? onNavRefresh;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Map<String, dynamic> _settings = {};
  Map<String, dynamic> _integrations = {};
  List<Map<String, dynamic>> _templates = [];
  List<Map<String, dynamic>> _audit = [];
  bool _loading = true;
  String? _error;
  String _status = '';
  String _tenantStrategy = '';
  bool _multiTenant = false;
  bool _isolationOpsAvailable = false;
  String _isolationConfigured = '';
  String _isolationEffective = '';
  bool _isolationHasOverride = false;
  String _isolationReloadHint = '';
  String _isolationOpsStatus = '';
  String _isolationModeDraft = 'shared_database';
  final _isolationConfirmController = TextEditingController();
  static const _isolationModes = [
    'shared_database',
    'database_per_tenant',
    'schema_per_tenant',
    'hybrid',
  ];
  DocumentPlatformSettings _documentSettings = parseDocumentPlatformSettings({});
  SecurityPlatformSettings _securitySettings = parseSecurityPlatformSettings({});

  String? _selectedTemplateId;
  bool _creatingTemplate = false;
  bool _templateDetailOpen = false;
  final _templateCodeController = TextEditingController();
  final _templateChannelController = TextEditingController(text: 'email');
  final _templateSubjectController = TextEditingController();
  final _templateBodyController = TextEditingController();
  final _tenantThemeController = TextEditingController(text: 'default');
  final _tenantDomainController = TextEditingController(text: 'localhost');
  final _paymentPublishableController = TextEditingController();
  final _paymentSecretController = TextEditingController();
  final _restBaseUrlController = TextEditingController();
  final _kafkaBootstrapController = TextEditingController();
  final _kafkaTopicPrefixController = TextEditingController();
  final _soapEndpointController = TextEditingController();
  final _webhookSecretController = TextEditingController();
  String _paymentProvider = 'stripe';
  bool _paymentSecretConfigured = false;
  bool _webhookSecretConfigured = false;
  String _integrationTestStatus = '';
  static const _paymentProviders = ['stripe', 'paypal', 'manual'];

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _templateCodeController.dispose();
    _templateChannelController.dispose();
    _templateSubjectController.dispose();
    _templateBodyController.dispose();
    _tenantThemeController.dispose();
    _tenantDomainController.dispose();
    _paymentPublishableController.dispose();
    _paymentSecretController.dispose();
    _restBaseUrlController.dispose();
    _kafkaBootstrapController.dispose();
    _kafkaTopicPrefixController.dispose();
    _soapEndpointController.dispose();
    _webhookSecretController.dispose();
    _isolationConfirmController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final settingsPayload = await widget.client.getAdminSettings();
      final integrationsPayload = await widget.client.getAdminIntegrations();
      final templates = await widget.client.listAdminTemplates();
      final audit = await widget.client.getAdminAudit();
      final health = await widget.client.getHealth();
      final platformConfig = await widget.client.getPlatformConfig();
      var isolationOpsAvailable = false;
      var isolationConfigured = '${health['tenant_strategy']}';
      var isolationEffective = isolationConfigured;
      var isolationHasOverride = false;
      var isolationReloadHint = '';
      var isolationModeDraft = isolationConfigured.isNotEmpty ? isolationConfigured : 'shared_database';
      try {
        final isolation = await widget.client.getTenantIsolationOps();
        isolationOpsAvailable = true;
        isolationConfigured = '${isolation['configured_mode'] ?? isolationConfigured}';
        isolationEffective = '${isolation['effective_mode'] ?? isolationConfigured}';
        isolationHasOverride = isolation['has_override'] == true;
        isolationReloadHint = '${isolation['reload_hint'] ?? ''}';
        isolationModeDraft = isolationEffective.isNotEmpty ? isolationEffective : 'shared_database';
      } catch (_) {
        isolationOpsAvailable = false;
      }
      if (!mounted) return;
      final settings = Map<String, dynamic>.from(settingsPayload['settings'] as Map? ?? {});
      final tenants = settings['tenants'] as Map? ?? {};
      final defaultTenant = tenants['default'] as Map? ?? {};
      setState(() {
        _settings = settings;
        _integrations = Map<String, dynamic>.from(integrationsPayload['integrations'] as Map? ?? {});
        _templates = templates;
        _audit = audit;
        _tenantStrategy = '${health['tenant_strategy']}';
        _multiTenant = health['multi_tenant'] == true;
        _isolationOpsAvailable = isolationOpsAvailable;
        _isolationConfigured = isolationConfigured;
        _isolationEffective = isolationEffective;
        _isolationHasOverride = isolationHasOverride;
        _isolationReloadHint = isolationReloadHint;
        _isolationModeDraft = isolationModeDraft;
        _documentSettings = parseDocumentPlatformSettings(platformConfig);
        _securitySettings = parseSecurityPlatformSettings(platformConfig);
        _tenantThemeController.text = '${defaultTenant['theme'] ?? 'default'}';
        _tenantDomainController.text = '${defaultTenant['domain'] ?? 'localhost'}';
        _syncPaymentFields(settings);
        _syncIntegrationFields(_integrations);
        _loading = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _error = err.toString();
        _loading = false;
      });
    }
  }

  String _isolationModeLabel(String mode) {
    final key = 'settings.isolation.modes.$mode';
    final label = EmcapLocale.t(key);
    return label == key ? mode : label;
  }

  Future<void> _applyIsolationMode() async {
    setState(() {
      _isolationOpsStatus = '';
      _error = null;
    });
    try {
      final result = await widget.client.putTenantIsolationOps(
        mode: _isolationModeDraft,
        confirmationToken: _isolationConfirmController.text,
      );
      if (!mounted) return;
      setState(() {
        _isolationOpsStatus = '${result['reload_hint'] ?? ''}';
        _isolationConfirmController.clear();
      });
      await _reload();
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _isolationOpsStatus = EmcapLocale.t('settings.isolation.applyFailed');
      });
    }
  }

  bool _bool(String section, String key) {
    final map = _settings[section];
    if (map is Map && map[key] is bool) {
      return map[key] as bool;
    }
    return false;
  }

  bool _flag(String section, String module, String key) {
    final map = _settings[section];
    if (map is! Map) return false;
    final moduleMap = map[module];
    if (moduleMap is Map && moduleMap[key] is bool) {
      return moduleMap[key] as bool;
    }
    return false;
  }

  void _setBool(String section, String key, bool value) {
    final map = Map<String, dynamic>.from(_settings[section] as Map? ?? {});
    map[key] = value;
    _settings = {..._settings, section: map};
    setState(() {});
  }

  void _setFlag(String section, String module, String key, bool value) {
    final sectionMap = Map<String, dynamic>.from(_settings[section] as Map? ?? {});
    final moduleMap = Map<String, dynamic>.from(sectionMap[module] as Map? ?? {});
    moduleMap[key] = value;
    sectionMap[module] = moduleMap;
    _settings = {..._settings, section: sectionMap};
    setState(() {});
  }

  void _applyBranding() {
    final tenants = Map<String, dynamic>.from(_settings['tenants'] as Map? ?? {});
    final defaultTenant = Map<String, dynamic>.from(tenants['default'] as Map? ?? {});
    defaultTenant['theme'] = _tenantThemeController.text.trim();
    defaultTenant['domain'] = _tenantDomainController.text.trim();
    tenants['default'] = defaultTenant;
    _settings = {..._settings, 'tenants': tenants};
  }

  void _syncPaymentFields(Map<String, dynamic> settings) {
    final payments = settings['payments'];
    if (payments is! Map) return;
    _paymentProvider = '${payments['provider'] ?? 'stripe'}';
    final stripe = payments['stripe'];
    if (stripe is Map) {
      _paymentPublishableController.text = '${stripe['publishable_key'] ?? ''}';
      final secretView = stripe['secret_key'];
      _paymentSecretConfigured =
          secretView is Map && secretView['configured'] == true;
    }
    _paymentSecretController.clear();
  }

  void _applyPaymentCredentials() {
    final payments = Map<String, dynamic>.from(_settings['payments'] as Map? ?? {});
    final stripe = Map<String, dynamic>.from(payments['stripe'] as Map? ?? {});
    payments['provider'] = _paymentProvider;
    stripe['publishable_key'] = _paymentPublishableController.text.trim();
    final secretDraft = _paymentSecretController.text.trim();
    if (secretDraft.isNotEmpty) {
      stripe['secret_key'] = secretDraft;
    } else {
      stripe.remove('secret_key');
    }
    payments['stripe'] = stripe;
    _settings = {..._settings, 'payments': payments};
  }

  void _applyIntegrationFields() {
    final rest = Map<String, dynamic>.from(_integrations['rest'] as Map? ?? {});
    final kafka = Map<String, dynamic>.from(_integrations['kafka'] as Map? ?? {});
    final soap = Map<String, dynamic>.from(_integrations['soap'] as Map? ?? {});
    final webhook = Map<String, dynamic>.from(_integrations['webhook'] as Map? ?? {});
    rest['base_url'] = _restBaseUrlController.text.trim();
    kafka['bootstrap'] = _kafkaBootstrapController.text.trim();
    kafka['topic_prefix'] = _kafkaTopicPrefixController.text.trim();
    soap['endpoint'] = _soapEndpointController.text.trim();
    final secretDraft = _webhookSecretController.text.trim();
    if (secretDraft.isNotEmpty) {
      webhook['signing_secret'] = secretDraft;
    } else {
      webhook.remove('signing_secret');
    }
    _integrations = {..._integrations, 'rest': rest, 'kafka': kafka, 'soap': soap, 'webhook': webhook};
  }

  void _syncIntegrationFields(Map<String, dynamic> integrations) {
    final rest = integrations['rest'];
    if (rest is Map) {
      _restBaseUrlController.text = '${rest['base_url'] ?? ''}';
    }
    final kafka = integrations['kafka'];
    if (kafka is Map) {
      _kafkaBootstrapController.text = '${kafka['bootstrap'] ?? ''}';
      _kafkaTopicPrefixController.text = '${kafka['topic_prefix'] ?? ''}';
    }
    final soap = integrations['soap'];
    if (soap is Map) {
      _soapEndpointController.text = '${soap['endpoint'] ?? ''}';
    }
    final webhook = integrations['webhook'];
    _webhookSecretConfigured =
        webhook is Map && webhook['signing_secret'] is Map && webhook['signing_secret']['configured'] == true;
    _webhookSecretController.clear();
    _integrationTestStatus = '';
  }

  Future<void> _testRestIntegration() async {
    setState(() => _integrationTestStatus = '');
    try {
      final result = await widget.client.testAdminRestIntegration();
      if (!mounted) return;
      setState(() {
        _integrationTestStatus = '${EmcapLocale.t('settings.integrations.testOk')} (${result['job_id']})';
      });
    } catch (err) {
      if (!mounted) return;
      setState(() => _integrationTestStatus = EmcapLocale.t('settings.integrations.testFailed'));
    }
  }

  bool get _paymentsModuleEnabled => _flag('modules', 'payments', 'enabled');

  bool get _paymentCredentialsEnabled =>
      _paymentsModuleEnabled && _bool('payments', 'enabled');

  Future<void> _saveSettings() async {
    _applyBranding();
    _applyPaymentCredentials();
    _applyIntegrationFields();
    setState(() {
      _status = '';
      _error = null;
    });
    try {
      final settingsPayload = await widget.client.updateAdminSettings(_settings);
      final integrationsPayload = await widget.client.updateAdminIntegrations(_integrations);
      if (!mounted) return;
      final settings = Map<String, dynamic>.from(settingsPayload['settings'] as Map? ?? _settings);
      final integrations = Map<String, dynamic>.from(integrationsPayload['integrations'] as Map? ?? _integrations);
      setState(() {
        _settings = settings;
        _integrations = integrations;
        _syncPaymentFields(settings);
        _syncIntegrationFields(integrations);
        _status = EmcapLocale.t('settings.saved');
      });
      widget.onNavRefresh?.call();
    } catch (err) {
      if (!mounted) return;
      setState(() => _error = err.toString());
    }
  }

  Map<String, dynamic>? get _selectedTemplate {
    if (_selectedTemplateId == null) return null;
    for (final template in _templates) {
      if ('${template['id']}' == _selectedTemplateId) return template;
    }
    return null;
  }

  void _selectTemplate(Map<String, dynamic> template) {
    setState(() {
      _creatingTemplate = false;
      _selectedTemplateId = '${template['id']}';
      _templateCodeController.text = '${template['code']}';
      _templateChannelController.text = '${template['channel'] ?? 'email'}';
      _templateSubjectController.text = '${template['subject'] ?? ''}';
      _templateBodyController.text = '${template['body'] ?? ''}';
      _templateDetailOpen = true;
    });
  }

  void _startCreateTemplate() {
    setState(() {
      _creatingTemplate = true;
      _selectedTemplateId = null;
      _templateCodeController.clear();
      _templateChannelController.text = 'email';
      _templateSubjectController.clear();
      _templateBodyController.clear();
      _templateDetailOpen = true;
    });
  }

  Future<void> _saveTemplate() async {
    try {
      final selected = _selectedTemplate;
      if (selected != null) {
        await widget.client.updateAdminTemplate(
          '${selected['id']}',
          channel: _templateChannelController.text.trim(),
          subject: _templateSubjectController.text.trim(),
          body: _templateBodyController.text,
        );
      } else {
        await widget.client.createAdminTemplate(
          code: _templateCodeController.text.trim(),
          channel: _templateChannelController.text.trim(),
          subject: _templateSubjectController.text.trim(),
          body: _templateBodyController.text,
        );
      }
      await _reload();
      if (!mounted) return;
      setState(() => _templateDetailOpen = false);
    } catch (err) {
      if (!mounted) return;
      setState(() => _error = err.toString());
    }
  }

  Future<void> _deleteTemplate() async {
    final selected = _selectedTemplate;
    if (selected == null) return;
    await widget.client.deleteAdminTemplate('${selected['id']}');
    await _reload();
    if (!mounted) return;
    setState(() {
      _selectedTemplateId = null;
      _templateDetailOpen = false;
    });
  }

  List<Map<String, dynamic>> _templateChannelBarData() => [
        {
          'channel': 'email',
          'label': EmcapLocale.t('settings.channels.email'),
          'enabled': _bool('notifications', 'email'),
        },
        {
          'channel': 'sms',
          'label': EmcapLocale.t('settings.channels.sms'),
          'enabled': _bool('notifications', 'sms'),
        },
        {
          'channel': 'push',
          'label': EmcapLocale.t('settings.channels.push'),
          'enabled': _bool('notifications', 'push'),
        },
      ];

  String _channelBarStateLabel(bool enabled) =>
      enabled ? EmcapLocale.t('settings.channels.enabled') : EmcapLocale.t('settings.channels.disabled');

  Widget _templateChannelBar() {
    final tokens = context.emcapTokens;
    return Wrap(
      spacing: tokens.spaceSm,
      runSpacing: tokens.spaceSm,
      children: _templateChannelBarData()
          .map(
            (chip) => EmcapStatusChip(
              label: '${chip['label']} · ${_channelBarStateLabel(chip['enabled'] as bool)}',
              active: chip['enabled'] as bool,
            ),
          )
          .toList(),
    );
  }

  Widget _documentSettingRow(String label, String value) {
    final tokens = context.emcapTokens;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: tokens.spaceXs + 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Expanded(
            flex: 3,
            child: Text(value, style: Theme.of(context).textTheme.titleSmall),
          ),
        ],
      ),
    );
  }

  List<SettingsToggleItem> _moduleItems() => [
        SettingsToggleItem(
          key: 'workflow',
          label: EmcapLocale.t('settings.modules.workflow'),
          checked: _flag('modules', 'workflow', 'enabled'),
        ),
        SettingsToggleItem(
          key: 'payments',
          label: EmcapLocale.t('settings.modules.payments'),
          checked: _flag('modules', 'payments', 'enabled'),
        ),
        SettingsToggleItem(
          key: 'notifications',
          label: EmcapLocale.t('settings.modules.notifications'),
          checked: _flag('modules', 'notifications', 'enabled'),
        ),
        SettingsToggleItem(
          key: 'ai',
          label: EmcapLocale.t('settings.modules.ai'),
          checked: _flag('modules', 'ai', 'enabled'),
        ),
      ];

  @override
  Widget build(BuildContext context) {
    final tokens = context.emcapTokens;
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final templateListPane = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: _startCreateTemplate,
            icon: const Icon(Icons.add),
            label: Text(EmcapLocale.t('settings.templates.new')),
          ),
        ),
        Expanded(
          child: Card(
            margin: EdgeInsets.zero,
            child: ListView.separated(
              itemCount: _templates.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final template = _templates[index];
                return ListTile(
                  selected: _selectedTemplateId == '${template['id']}',
                  title: Text('${template['code']}'),
                  subtitle: Text('${template['channel']} · ${template['subject']}'),
                  onTap: () => _selectTemplate(template),
                );
              },
            ),
          ),
        ),
      ],
    );

    final templateDetailPane = (!_creatingTemplate && _selectedTemplate == null)
        ? DetailPlaceholder(message: EmcapLocale.t('settings.templates.selectPlaceholder'))
        : ListView(
            padding: EdgeInsets.all(tokens.spaceSm + 4),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _selectedTemplate != null
                          ? EmcapLocale.t('settings.templates.editTitle')
                          : EmcapLocale.t('settings.templates.createTitle'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  if (_selectedTemplate != null)
                    TextButton(onPressed: _deleteTemplate, child: Text(EmcapLocale.t('settings.templates.delete'))),
                  FilledButton(onPressed: _saveTemplate, child: Text(EmcapLocale.t('settings.templates.save'))),
                ],
              ),
              if (_selectedTemplate == null)
                TextField(
                  controller: _templateCodeController,
                  decoration: InputDecoration(
                    labelText: EmcapLocale.t('settings.templates.code'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              TextField(
                controller: _templateChannelController,
                decoration: InputDecoration(
                  labelText: EmcapLocale.t('settings.templates.channel'),
                  border: const OutlineInputBorder(),
                ),
              ),
              TextField(
                controller: _templateSubjectController,
                decoration: InputDecoration(
                  labelText: EmcapLocale.t('settings.templates.subject'),
                  border: const OutlineInputBorder(),
                ),
              ),
              TextField(
                controller: _templateBodyController,
                decoration: InputDecoration(
                  labelText: EmcapLocale.t('settings.templates.body'),
                  border: const OutlineInputBorder(),
                ),
                maxLines: 6,
              ),
            ],
          );

    return ListView(
      padding: EdgeInsets.only(bottom: tokens.spaceLg),
      children: [
        Text(EmcapLocale.t('settings.title'), style: Theme.of(context).textTheme.titleLarge),
        Text(EmcapLocale.t('settings.subtitle'), style: Theme.of(context).textTheme.bodySmall),
        if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        if (_status.isNotEmpty) Text(_status, style: TextStyle(color: Theme.of(context).colorScheme.primary)),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton(onPressed: _saveSettings, child: Text(EmcapLocale.t('settings.save'))),
        ),
        SizedBox(height: tokens.spaceSm),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.modules'),
          items: _moduleItems(),
          onChanged: (key, checked) => _setFlag('modules', key, 'enabled', checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.auth'),
          items: [
            SettingsToggleItem(
              key: 'username_password',
              label: EmcapLocale.t('settings.auth.usernamePassword'),
              checked: _bool('authentication', 'username_password'),
            ),
            SettingsToggleItem(key: 'oauth', label: EmcapLocale.t('settings.auth.oauth'), checked: _bool('authentication', 'oauth')),
            SettingsToggleItem(key: 'ldap', label: EmcapLocale.t('settings.auth.ldap'), checked: _bool('authentication', 'ldap')),
            SettingsToggleItem(key: 'sso', label: EmcapLocale.t('settings.auth.sso'), checked: _bool('authentication', 'sso')),
          ],
          onChanged: (key, checked) => _setBool('authentication', key, checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.notifications'),
          items: [
            SettingsToggleItem(key: 'email', label: EmcapLocale.t('settings.channels.email'), checked: _bool('notifications', 'email')),
            SettingsToggleItem(key: 'sms', label: EmcapLocale.t('settings.channels.sms'), checked: _bool('notifications', 'sms')),
            SettingsToggleItem(key: 'push', label: EmcapLocale.t('settings.channels.push'), checked: _bool('notifications', 'push')),
            SettingsToggleItem(key: 'whatsapp', label: EmcapLocale.t('settings.channels.whatsapp'), checked: _bool('notifications', 'whatsapp')),
          ],
          onChanged: (key, checked) => _setBool('notifications', key, checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.grid'),
          items: [
            SettingsToggleItem(key: 'export_csv', label: EmcapLocale.t('settings.grid.exportCsv'), checked: _bool('grid', 'export_csv')),
            SettingsToggleItem(key: 'export_excel', label: EmcapLocale.t('settings.grid.exportExcel'), checked: _bool('grid', 'export_excel')),
            SettingsToggleItem(key: 'export_pdf', label: EmcapLocale.t('settings.grid.exportPdf'), checked: _bool('grid', 'export_pdf')),
            SettingsToggleItem(key: 'grouping', label: EmcapLocale.t('settings.grid.grouping'), checked: _bool('grid', 'grouping')),
            SettingsToggleItem(key: 'realtime', label: EmcapLocale.t('settings.grid.realtime'), checked: _bool('grid', 'realtime')),
            SettingsToggleItem(key: 'offline', label: EmcapLocale.t('settings.grid.offline'), checked: _bool('grid', 'offline')),
          ],
          onChanged: (key, checked) => _setBool('grid', key, checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.workflow'),
          items: [
            SettingsToggleItem(key: 'enabled', label: EmcapLocale.t('settings.workflow.engine'), checked: _bool('workflow', 'enabled')),
            SettingsToggleItem(key: 'escalation', label: EmcapLocale.t('settings.workflow.escalation'), checked: _bool('workflow', 'escalation')),
            SettingsToggleItem(key: 'delegation', label: EmcapLocale.t('settings.workflow.delegation'), checked: _bool('workflow', 'delegation')),
            SettingsToggleItem(key: 'sla_tracking', label: EmcapLocale.t('settings.workflow.slaTracking'), checked: _bool('workflow', 'sla_tracking')),
          ],
          onChanged: (key, checked) => _setBool('workflow', key, checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.rules'),
          items: [
            SettingsToggleItem(key: 'formula_enabled', label: EmcapLocale.t('settings.rules.formula'), checked: _bool('rules', 'formula_enabled')),
            SettingsToggleItem(key: 'scripting_enabled', label: EmcapLocale.t('settings.rules.scripting'), checked: _bool('rules', 'scripting_enabled')),
          ],
          onChanged: (key, checked) => _setBool('rules', key, checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.payments'),
          items: [
            SettingsToggleItem(
              key: 'enabled',
              label: EmcapLocale.t('settings.payments.enabled'),
              checked: _bool('payments', 'enabled'),
            ),
          ],
          onChanged: (key, checked) => _setBool('payments', key, checked),
        ),
        if (!_paymentsModuleEnabled)
          Padding(
            padding: EdgeInsets.only(bottom: tokens.spaceSm),
            child: Text(
              EmcapLocale.t('settings.payments.moduleRequired'),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          )
        else
          Card(
            margin: EdgeInsets.only(bottom: tokens.spaceSm),
            child: Padding(
              padding: EdgeInsets.all(tokens.spaceSm + 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    value: _paymentProviders.contains(_paymentProvider) ? _paymentProvider : 'stripe',
                    decoration: InputDecoration(
                      labelText: EmcapLocale.t('settings.payments.provider'),
                      border: const OutlineInputBorder(),
                    ),
                    items: _paymentProviders
                        .map((provider) => DropdownMenuItem(value: provider, child: Text(provider)))
                        .toList(),
                    onChanged: _paymentCredentialsEnabled
                        ? (value) {
                            if (value == null) return;
                            setState(() => _paymentProvider = value);
                          }
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _paymentPublishableController,
                    enabled: _paymentCredentialsEnabled,
                    decoration: InputDecoration(
                      labelText: EmcapLocale.t('settings.payments.publishableKey'),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _paymentSecretController,
                    enabled: _paymentCredentialsEnabled,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: EmcapLocale.t('settings.payments.secret'),
                      hintText: _paymentSecretConfigured
                          ? EmcapLocale.t('settings.payments.replaceSecret')
                          : null,
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  if (_paymentSecretConfigured) ...[
                    SizedBox(height: tokens.spaceSm),
                    Text(
                      EmcapLocale.t('settings.payments.configured'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
        Card(
          margin: EdgeInsets.only(bottom: tokens.spaceSm),
          child: ExpansionTile(
            title: Text(EmcapLocale.t('settings.sections.integrations')),
            subtitle: Text(EmcapLocale.t('settings.integrations.subtitle')),
            children: [
              Padding(
                padding: EdgeInsets.all(tokens.spaceSm + 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _restBaseUrlController,
                      decoration: InputDecoration(
                        labelText: EmcapLocale.t('settings.integrations.restBaseUrl'),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _kafkaBootstrapController,
                      decoration: InputDecoration(
                        labelText: EmcapLocale.t('settings.integrations.kafkaBootstrap'),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _kafkaTopicPrefixController,
                      decoration: InputDecoration(
                        labelText: EmcapLocale.t('settings.integrations.kafkaTopicPrefix'),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _soapEndpointController,
                      decoration: InputDecoration(
                        labelText: EmcapLocale.t('settings.integrations.soapEndpoint'),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _webhookSecretController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: EmcapLocale.t('settings.integrations.webhookSecret'),
                        hintText: _webhookSecretConfigured
                            ? EmcapLocale.t('settings.integrations.replaceSecret')
                            : null,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    if (_webhookSecretConfigured) ...[
                      SizedBox(height: tokens.spaceSm),
                      Text(
                        EmcapLocale.t('settings.integrations.configured'),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _testRestIntegration,
                      child: Text(EmcapLocale.t('settings.integrations.testRest')),
                    ),
                    if (_integrationTestStatus.isNotEmpty) ...[
                      SizedBox(height: tokens.spaceSm),
                      Text(_integrationTestStatus, style: Theme.of(context).textTheme.bodySmall),
                    ],
                    SizedBox(height: tokens.spaceSm),
                    Text(
                      EmcapLocale.t('settings.integrations.accountHint'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.ai'),
          items: [
            SettingsToggleItem(key: 'enabled', label: EmcapLocale.t('settings.ai.enabled'), checked: _bool('ai', 'enabled')),
          ],
          onChanged: (key, checked) => _setBool('ai', key, checked),
        ),
        SettingsToggleGroup(
          title: EmcapLocale.t('settings.sections.audit'),
          items: [
            SettingsToggleItem(key: 'enabled', label: EmcapLocale.t('settings.audit.enabled'), checked: _bool('audit', 'enabled')),
            SettingsToggleItem(key: 'immutable', label: EmcapLocale.t('settings.audit.immutable'), checked: _bool('audit', 'immutable')),
          ],
          onChanged: (key, checked) => _setBool('audit', key, checked),
        ),
        Card(
          margin: EdgeInsets.only(bottom: tokens.spaceSm),
          child: ExpansionTile(
            title: Text(EmcapLocale.t('settings.sections.isolation')),
            children: [
              Padding(
                padding: EdgeInsets.all(tokens.spaceSm + 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _documentSettingRow(
                      EmcapLocale.t('settings.isolation.configured'),
                      _isolationConfigured.isNotEmpty ? _isolationConfigured : _tenantStrategy,
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.isolation.effective'),
                      _isolationEffective.isNotEmpty ? _isolationEffective : _tenantStrategy,
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.isolation.multiTenant'),
                      _multiTenant
                          ? EmcapLocale.t('settings.isolation.enabled')
                          : EmcapLocale.t('settings.isolation.disabled'),
                    ),
                    if (_isolationHasOverride) ...[
                      SizedBox(height: tokens.spaceSm),
                      EmcapBadge(label: EmcapLocale.t('settings.layouts.overrideBadge'), variant: EmcapBadgeVariant.off),
                    ],
                    if (_isolationOpsAvailable) ...[
                      SizedBox(height: tokens.spaceSm),
                      DropdownButtonFormField<String>(
                        value: _isolationModes.contains(_isolationModeDraft) ? _isolationModeDraft : _isolationModes.first,
                        decoration: InputDecoration(
                          labelText: EmcapLocale.t('settings.isolation.mode'),
                          border: const OutlineInputBorder(),
                        ),
                        items: _isolationModes
                            .map(
                              (mode) => DropdownMenuItem(
                                value: mode,
                                child: Text(_isolationModeLabel(mode)),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          if (value == null) return;
                          setState(() => _isolationModeDraft = value);
                        },
                      ),
                      SizedBox(height: tokens.spaceSm),
                      TextField(
                        controller: _isolationConfirmController,
                        decoration: InputDecoration(
                          labelText: EmcapLocale.t('settings.isolation.confirmationToken'),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      SizedBox(height: tokens.spaceSm),
                      FilledButton(
                        onPressed: _applyIsolationMode,
                        child: Text(EmcapLocale.t('settings.isolation.apply')),
                      ),
                    ] else
                      Text(
                        EmcapLocale.t('settings.isolation.opsReadOnly'),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    if (_isolationReloadHint.isNotEmpty) ...[
                      SizedBox(height: tokens.spaceSm),
                      Text(_isolationReloadHint, style: Theme.of(context).textTheme.bodySmall),
                    ],
                    if (_isolationOpsStatus.isNotEmpty) ...[
                      SizedBox(height: tokens.spaceSm),
                      Text(_isolationOpsStatus, style: Theme.of(context).textTheme.bodySmall),
                    ],
                    SizedBox(height: tokens.spaceSm),
                    Text(
                      EmcapLocale.t('settings.isolation.runbookHint'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Card(
          margin: EdgeInsets.only(bottom: tokens.spaceSm),
          child: ExpansionTile(
            title: Text(EmcapLocale.t('settings.sections.layouts')),
            subtitle: Text(EmcapLocale.t('settings.layouts.subtitle')),
            children: [
              Padding(
                padding: EdgeInsets.all(tokens.spaceSm + 4),
                child: LayoutEditorPanel(client: widget.client),
              ),
            ],
          ),
        ),
        Card(
          margin: EdgeInsets.only(bottom: tokens.spaceSm),
          child: ExpansionTile(
            title: Text(EmcapLocale.t('settings.sections.security')),
            children: [
              Padding(
                padding: EdgeInsets.all(tokens.spaceSm + 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _documentSettingRow(
                      EmcapLocale.t('settings.security.rateLimit'),
                      '${_securitySettings.rateLimitPerMinute} ${EmcapLocale.t('settings.security.requestsPerMinute')}',
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.security.headers'),
                      _securitySettings.securityHeadersEnabled
                          ? EmcapLocale.t('settings.security.headersEnabled')
                          : EmcapLocale.t('settings.security.headersDisabled'),
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.security.mfa'),
                      EmcapLocale.t('settings.security.mfaAccount'),
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.security.abacPolicies'),
                      '${_securitySettings.abacPolicyCount}',
                    ),
                    SizedBox(height: tokens.spaceSm),
                    Text(
                      EmcapLocale.t('settings.security.readOnlyHint'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Card(
          margin: EdgeInsets.only(bottom: tokens.spaceSm),
          child: ExpansionTile(
            title: Text(EmcapLocale.t('settings.sections.documents')),
            subtitle: Text(EmcapLocale.t('settings.documents.subtitle')),
            children: [
              Padding(
                padding: EdgeInsets.all(tokens.spaceSm + 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: EmcapBadge(
                        label: EmcapLocale.t('settings.documents.readOnlyBadge'),
                        variant: EmcapBadgeVariant.off,
                      ),
                    ),
                    SizedBox(height: tokens.spaceSm),
                    _documentSettingRow(
                      EmcapLocale.t('settings.documents.storageBackend'),
                      _documentSettings.storageBackend,
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.documents.maxUploadSize'),
                      '${_documentSettings.maxUploadSizeMb} ${EmcapLocale.t('settings.documents.megabytes')}',
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.documents.virusScan'),
                      _documentSettings.virusScanEnabled
                          ? EmcapLocale.t('settings.documents.enabled')
                          : EmcapLocale.t('settings.documents.disabled'),
                    ),
                    _documentSettingRow(
                      EmcapLocale.t('settings.documents.retentionDays'),
                      '${_documentSettings.retentionDays}',
                    ),
                    SizedBox(height: tokens.spaceSm),
                    Text(
                      EmcapLocale.t('settings.documents.readOnlyHint'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Card(
          margin: EdgeInsets.only(bottom: tokens.spaceSm),
          child: ExpansionTile(
            title: Text(EmcapLocale.t('settings.sections.branding')),
            children: [
              Padding(
                padding: EdgeInsets.all(tokens.spaceSm + 4),
                child: Column(
                  children: [
                    TextField(
                      controller: _tenantThemeController,
                      decoration: const InputDecoration(labelText: 'Theme', border: OutlineInputBorder()),
                    ),
                    TextField(
                      controller: _tenantDomainController,
                      decoration: const InputDecoration(labelText: 'Domain', border: OutlineInputBorder()),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Text('Email templates', style: Theme.of(context).textTheme.titleMedium),
        SizedBox(height: tokens.spaceSm),
        _templateChannelBar(),
        SizedBox(height: tokens.spaceSm),
        SizedBox(
          height: 360,
          child: MasterDetailLayout(
            listPane: templateListPane,
            detailPane: templateDetailPane,
            detailOpen: _templateDetailOpen,
            onBack: () => setState(() {
              _templateDetailOpen = false;
              _creatingTemplate = false;
              _selectedTemplateId = null;
            }),
          ),
        ),
        const SizedBox(height: 12),
        Text('Admin audit (${_audit.length})', style: Theme.of(context).textTheme.titleMedium),
        ..._audit.take(20).map(
              (entry) => ListTile(
                dense: true,
                title: Text('${entry['action'] ?? entry['event']}'),
                subtitle: Text('${entry['actor'] ?? ''} · ${entry['timestamp'] ?? entry['created_at'] ?? ''}'),
              ),
            ),
      ],
    );
  }
}
