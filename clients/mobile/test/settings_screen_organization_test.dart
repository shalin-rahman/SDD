import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/settings_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/utils/organization_logo_util.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_test_harness.dart';

class _OrgSettingsClient extends EmcapClient {
  Map<String, dynamic>? lastOrgProfilePayload;

  @override
  Future<Map<String, dynamic>> getAdminSettings() async => {
        'settings': {'modules': {}, 'tenants': {'default': {}}},
        'editable_paths': [],
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> getAdminOrganizationProfile() async => {
        'profile': {
          'display_name': 'Acme Widgets',
          'legal_name': 'Acme Widgets LLC',
          'tax_id': 'TAX-99',
          'email': 'billing@acme.example',
          'phone': '+1-555-0100',
          'logo_url': 'https://cdn.example/logo.png',
          'invoice': {'header': '{{display_name}} Invoice', 'footer': 'Thank you'},
          'report': {'header': 'Confidential Report', 'footer': 'Generated {{date}}'},
        },
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> getAdminIntegrations() async => {
        'integrations': {},
        'override_paths': [],
      };

  @override
  Future<List<Map<String, dynamic>>> listAdminTemplates() async => [];

  @override
  Future<List<Map<String, dynamic>>> getAdminAudit() async => [];

  @override
  Future<Map<String, dynamic>> getHealth() async => {
        'tenant_strategy': 'shared_database',
        'multi_tenant': false,
      };

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {
        'organization_profile': {'display_name': 'Platform Fallback'},
      };

  @override
  Future<Map<String, dynamic>> getTenantIsolationOps() async => {
        'configured_mode': 'shared_database',
        'effective_mode': 'shared_database',
        'has_override': false,
        'reload_hint': '',
      };

  @override
  Future<Map<String, dynamic>> updateAdminSettings(Map<String, dynamic> settings) async => {
        'settings': settings,
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> updateAdminIntegrations(Map<String, dynamic> integrations) async => {
        'integrations': integrations,
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> updateAdminOrganizationProfile(Map<String, dynamic> profile) async {
    lastOrgProfilePayload = profile;
    return {'profile': profile, 'override_paths': []};
  }

  Map<String, dynamic>? lastLogoUploadPayload;

  @override
  Future<Map<String, dynamic>> uploadAdminOrganizationLogo({
    required String filename,
    required String contentBase64,
  }) async {
    lastLogoUploadPayload = {'filename': filename, 'content_base64': contentBase64};
    return {
      'logo_url': '/api/v1/documents/doc-1/content',
      'document_id': 'doc-1',
      'virus_scan_status': 'clean',
      'profile': {'display_name': 'Acme Widgets', 'logo_url': '/api/v1/documents/doc-1/content'},
    };
  }
}

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  Future<void> openOrganizationPanel(WidgetTester tester) async {
    final orgSection = find.text(EmcapLocale.t('settings.sections.organization'));
    await tester.ensureVisible(orgSection);
    await tester.tap(orgSection);
    await tester.pumpAndSettle();
  }

  testWidgets('SettingsScreen organization panel loads org profile and org.* labels', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: SettingsScreen(client: _OrgSettingsClient()),
      ),
    );
    await settleSettingsScreen(tester);
    await openOrganizationPanel(tester);

    expect(find.text(EmcapLocale.t('org.displayName.label')), findsOneWidget);
    expect(find.text(EmcapLocale.t('org.legalName.label')), findsOneWidget);
    expect(find.text(EmcapLocale.t('org.invoice.header')), findsOneWidget);
    expect(find.text(EmcapLocale.t('org.report.footer')), findsOneWidget);
    expect(find.text('Acme Widgets'), findsOneWidget);
    expect(find.text('billing@acme.example'), findsOneWidget);
  });

  testWidgets('SettingsScreen shows logo preview for https logo URL', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: SettingsScreen(client: _OrgSettingsClient()),
      ),
    );
    await settleSettingsScreen(tester);
    await openOrganizationPanel(tester);

    expect(find.byType(Image), findsOneWidget);
  });

  testWidgets('SettingsScreen save sends organization profile with templates', (tester) async {
    final client = _OrgSettingsClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: SettingsScreen(client: client),
      ),
    );
    await settleSettingsScreen(tester);
    await openOrganizationPanel(tester);

    await tester.enterText(
      find.widgetWithText(TextField, EmcapLocale.t('org.invoice.header')),
      'Updated header',
    );
    await tester.tap(find.text(EmcapLocale.t('settings.save')));
    await tester.pumpAndSettle();

    expect(client.lastOrgProfilePayload, isNotNull);
    final invoice = client.lastOrgProfilePayload!['invoice'] as Map<String, dynamic>;
    expect(invoice['header'], 'Updated header');
    expect(client.lastOrgProfilePayload!['display_name'], 'Acme Widgets');
  });

  testWidgets('SettingsScreen organization panel resolves org.* labels in fr-FR', (tester) async {
    await EmcapLocale.setLocaleTag('fr-FR');
    addTearDown(() => EmcapLocale.setLocaleTag('en-US'));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: SettingsScreen(client: _OrgSettingsClient()),
      ),
    );
    await settleSettingsScreen(tester);
    await openOrganizationPanel(tester);

    expect(find.text(EmcapLocale.t('org.displayName.label')), findsOneWidget);
    expect(find.text(EmcapLocale.t('org.invoice.header')), findsOneWidget);
  });

  testWidgets('SettingsScreen uploads logo via injectable picker', (tester) async {
    final client = _OrgSettingsClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: SettingsScreen(
          client: client,
          logoPicker: () async => OrganizationLogoPick(
            filename: 'logo.png',
            bytes: Uint8List.fromList([137, 80, 78, 71]),
          ),
        ),
      ),
    );
    await settleSettingsScreen(tester);
    await openOrganizationPanel(tester);

    await tester.tap(find.text(EmcapLocale.t('settings.organization.logoUpload')));
    await tester.pumpAndSettle();

    expect(client.lastLogoUploadPayload, isNotNull);
    expect(client.lastLogoUploadPayload!['filename'], 'logo.png');
    expect(find.text(EmcapLocale.t('settings.organization.logoUploadSuccess')), findsOneWidget);
  });
}
