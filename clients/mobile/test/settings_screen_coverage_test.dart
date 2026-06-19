import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/settings_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/utils/organization_logo_util.dart';

import 'support/screen_test_harness.dart';

class _FullSettingsClient extends EmcapClient {
  _FullSettingsClient({
    this.failReload = false,
    this.failRestTest = false,
    this.failIsolationApply = false,
    this.failIsolationOps = false,
  }) : super('http://localhost:8000');

  final bool failReload;
  final bool failRestTest;
  final bool failIsolationApply;
  final bool failIsolationOps;

  Map<String, dynamic>? lastSettingsPayload;
  Map<String, dynamic>? lastIntegrationsPayload;

  @override
  Future<Map<String, dynamic>> getAdminSettings() async {
    if (failReload) throw Exception('settings unavailable');
    return {
      'settings': {
        'modules': {
          'payments': {'enabled': true},
          'workflow': {'enabled': true},
          'ai': {'enabled': false},
        },
        'auth': {'mfa_required': true},
        'notifications': {'email': true, 'sms': false},
        'grid': {'page_size': 25, 'export_csv': true},
        'workflow': {'enabled': true},
        'rules': {'enabled': false},
        'payments': {
          'enabled': true,
          'provider': 'stripe',
          'stripe': {
            'publishable_key': 'pk_test',
            'secret_key': {'configured': true, 'masked': '***'},
          },
        },
        'tenants': {
          'default': {'theme': 'indigo', 'domain': 'acme.example'},
        },
      },
      'editable_paths': [],
      'override_paths': [],
    };
  }

  @override
  Future<Map<String, dynamic>> getAdminOrganizationProfile() async => {
        'profile': {
          'display_name': 'Acme',
          'legal_name': 'Acme LLC',
          'logo_url': '',
          'invoice': {'header': '', 'footer': ''},
          'report': {'header': '', 'footer': ''},
        },
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> getAdminIntegrations() async => {
        'integrations': {
          'rest': {'base_url': 'https://api.example'},
          'kafka': {'bootstrap': 'localhost:9092', 'topic_prefix': 'emcap'},
          'soap': {'endpoint': 'https://soap.example'},
          'webhook': {
            'signing_secret': {'configured': true, 'masked': '***'},
          },
        },
        'override_paths': [],
      };

  @override
  Future<List<Map<String, dynamic>>> listAdminTemplates() async => [
        {
          'id': 'tpl-1',
          'code': 'welcome',
          'channel': 'email',
          'subject': 'Welcome',
          'body': 'Hello {name}',
        },
      ];

  @override
  Future<List<Map<String, dynamic>>> getAdminAudit() async => [
        {'id': 'a1', 'action': 'settings.update', 'actor': 'admin'},
      ];

  @override
  Future<Map<String, dynamic>> getHealth() async => {
        'tenant_strategy': 'shared_database',
        'multi_tenant': true,
      };

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {
        'documents': {
          'storage_backend': 's3',
          'max_upload_size_mb': 10,
          'virus_scan_enabled': true,
          'retention_days': 180,
        },
        'security': {
          'rate_limit_per_minute': 200,
          'security_headers_enabled': true,
          'mfa_enrollment': 'account',
          'abac_policies': [{'permission': 'product.read'}],
        },
      };

  @override
  Future<Map<String, dynamic>> getTenantIsolationOps() async {
    if (failIsolationOps) throw Exception('ops unavailable');
    return {
      'configured_mode': 'shared_database',
      'effective_mode': 'schema_per_tenant',
      'has_override': true,
      'reload_hint': 'Restart API to apply',
    };
  }

  @override
  Future<Map<String, dynamic>> putTenantIsolationOps({
    required String mode,
    required String confirmationToken,
  }) async {
    if (failIsolationApply) throw Exception('apply denied');
    return {'reload_hint': 'Applied $mode'};
  }

  @override
  Future<Map<String, dynamic>> testAdminRestIntegration() async {
    if (failRestTest) throw Exception('rest down');
    return {'job_id': 'job-42'};
  }

  @override
  Future<Map<String, dynamic>> updateAdminSettings(Map<String, dynamic> settings) async {
    lastSettingsPayload = settings;
    return {'settings': settings, 'override_paths': []};
  }

  @override
  Future<Map<String, dynamic>> updateAdminIntegrations(Map<String, dynamic> integrations) async {
    lastIntegrationsPayload = integrations;
    return {'integrations': integrations, 'override_paths': []};
  }

  @override
  Future<Map<String, dynamic>> updateAdminOrganizationProfile(Map<String, dynamic> profile) async =>
      {'profile': profile, 'override_paths': []};

  @override
  Future<Map<String, dynamic>> createAdminTemplate({
    required String code,
    String channel = 'email',
    String subject = '',
    String body = '',
  }) async =>
      {'id': 'tpl-new', 'code': code, 'channel': channel, 'subject': subject, 'body': body};

  @override
  Future<Map<String, dynamic>> updateAdminTemplate(
    String templateId, {
    String? channel,
    String? subject,
    String? body,
  }) async =>
      {'id': templateId, 'channel': channel, 'subject': subject, 'body': body};

  @override
  Future<Map<String, dynamic>> getAdminLayoutMetadata(String entityCode) async =>
      {'layout': {'sections': []}};

  @override
  Future<Map<String, dynamic>> uploadAdminOrganizationLogo({
    required String filename,
    required String contentBase64,
  }) async {
    throw Exception('upload failed');
  }
}

Future<void> _expandSection(WidgetTester tester, String sectionKey) async {
  final section = find.text(EmcapLocale.t(sectionKey));
  await pumpUntilFound(tester, section);
  await tester.scrollUntilVisible(
    section.first,
    500,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.tap(section.first);
  await tester.pumpAndSettle();
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('SettingsScreen shows load error on reload failure', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient(failReload: true))),
      ),
    );
    await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));

    expect(find.textContaining('settings unavailable'), findsOneWidget);
  });

  testWidgets('SettingsScreen expands platform sections and toggles modules', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient())),
      ),
    );
    await settleSettingsScreen(tester);

    for (final key in [
      'settings.sections.modules',
      'settings.sections.auth',
      'settings.sections.notifications',
      'settings.sections.grid',
      'settings.sections.workflow',
      'settings.sections.rules',
      'settings.sections.ai',
    ]) {
      await _expandSection(tester, key);
    }

    final switches = tester.widgetList<SwitchListTile>(find.byType(SwitchListTile));
    expect(switches, isNotEmpty);
    await tester.tap(find.byType(SwitchListTile).first);
    await tester.pumpAndSettle();
  });

  testWidgets('SettingsScreen payments integrations documents security audit panels', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient())),
      ),
    );
    await settleSettingsScreen(tester);

    await _expandSection(tester, 'settings.sections.payments');
    expect(find.text(EmcapLocale.t('settings.payments.configured')), findsOneWidget);

    await _expandSection(tester, 'settings.sections.integrations');
    await tester.enterText(find.byType(TextField).first, 'https://rest.example');
    await tester.tap(find.text(EmcapLocale.t('settings.integrations.testRest')));
    await tester.pumpAndSettle();
    expect(find.textContaining('job-42'), findsOneWidget);

    await _expandSection(tester, 'settings.sections.documents');
    expect(find.text('s3'), findsOneWidget);

    await _expandSection(tester, 'settings.sections.security');
    expect(find.textContaining('200'), findsOneWidget);

    await _expandSection(tester, 'settings.sections.audit');
    await tester.tap(find.byType(SwitchListTile).first);
    await tester.pumpAndSettle();

    expect(find.textContaining('settings.update'), findsOneWidget);
  });

  testWidgets('SettingsScreen integration test failure shows error status', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient(failRestTest: true))),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.integrations');

    await tester.tap(find.text(EmcapLocale.t('settings.integrations.testRest')));
    await tester.pumpAndSettle();

    expect(find.text(EmcapLocale.t('settings.integrations.testFailed')), findsOneWidget);
  });

  testWidgets('SettingsScreen templates select create and save', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient())),
      ),
    );
    await settleSettingsScreen(tester);

    final templatesTitle = find.text(EmcapLocale.t('settings.templates.sectionTitle'));
    await tester.scrollUntilVisible(
      templatesTitle.first,
      500,
      scrollable: find.byType(Scrollable).first,
    );

    await tester.tap(find.text('welcome'));
    await tester.pumpAndSettle();
    expect(find.text('Welcome'), findsOneWidget);

    await tester.tap(find.text(EmcapLocale.t('settings.templates.new')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byWidgetPredicate(
        (w) =>
            w is TextField &&
            w.decoration?.labelText == EmcapLocale.t('settings.templates.code'),
      ),
      'onboard',
    );
    await tester.tap(find.text(EmcapLocale.t('settings.templates.save')));
    await tester.pumpAndSettle();
  });

  testWidgets('SettingsScreen isolation apply success and failure', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient())),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.isolation');

    expect(find.textContaining('Restart API'), findsOneWidget);
    await tester.enterText(find.byType(TextField).last, 'confirm');
    await tester.tap(find.text(EmcapLocale.t('settings.isolation.apply')));
    await tester.pumpAndSettle();
    expect(find.textContaining('Applied'), findsOneWidget);
  });

  testWidgets('SettingsScreen isolation apply failure shows message', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(
          body: SettingsScreen(client: _FullSettingsClient(failIsolationApply: true)),
        ),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.isolation');

    await tester.tap(find.text(EmcapLocale.t('settings.isolation.apply')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('settings.isolation.applyFailed')), findsOneWidget);
  });

  testWidgets('SettingsScreen isolation ops unavailable shows read-only hint', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient(failIsolationOps: true))),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.isolation');

    expect(find.text(EmcapLocale.t('settings.isolation.opsReadOnly')), findsOneWidget);
  });

  testWidgets('SettingsScreen branding save persists tenant theme and domain', (tester) async {
    final client = _FullSettingsClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: client)),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.branding');

    await tester.enterText(
      find.byWidgetPredicate((w) => w is TextField && w.decoration?.labelText == 'Theme'),
      'emerald',
    );
    await tester.enterText(
      find.byWidgetPredicate((w) => w is TextField && w.decoration?.labelText == 'Domain'),
      'widgets.example',
    );
    await tester.scrollUntilVisible(
      find.byKey(const Key('settings-save')),
      500,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.byKey(const Key('settings-save')));
    await tester.pumpAndSettle();

    expect(client.lastSettingsPayload, isNotNull);
    final tenants = client.lastSettingsPayload!['tenants'] as Map<String, dynamic>;
    final defaultTenant = tenants['default'] as Map<String, dynamic>;
    expect(defaultTenant['theme'], 'emerald');
    expect(defaultTenant['domain'], 'widgets.example');
    expect(find.text(EmcapLocale.t('settings.saved')), findsOneWidget);
  });

  testWidgets('SettingsScreen logo upload validation and unavailable paths', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(
          body: SettingsScreen(
            client: _FullSettingsClient(),
            logoPicker: () async => OrganizationLogoPick(
              filename: 'logo.exe',
              bytes: Uint8List.fromList([1, 2, 3]),
            ),
          ),
        ),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.organization');

    await tester.tap(find.text(EmcapLocale.t('settings.organization.logoUpload')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('settings.organization.logoUploadInvalidType')), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient())),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.organization');
    await tester.tap(find.text(EmcapLocale.t('settings.organization.logoUpload')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('settings.organization.logoUploadUnavailable')), findsOneWidget);
  });

  testWidgets('SettingsScreen logo upload failure shows error', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(
          body: SettingsScreen(
            client: _FullSettingsClient(),
            logoPicker: () async => OrganizationLogoPick(
              filename: 'logo.png',
              bytes: Uint8List.fromList([137, 80, 71]),
            ),
          ),
        ),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.organization');

    await tester.tap(find.text(EmcapLocale.t('settings.organization.logoUpload')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('settings.organization.logoUploadFailed')), findsOneWidget);
  });

  testWidgets('SettingsScreen layouts panel renders editor', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: Scaffold(body: SettingsScreen(client: _FullSettingsClient())),
      ),
    );
    await settleSettingsScreen(tester);
    await _expandSection(tester, 'settings.sections.layouts');

    expect(find.text(EmcapLocale.t('settings.layouts.subtitle')), findsOneWidget);
  });
}
