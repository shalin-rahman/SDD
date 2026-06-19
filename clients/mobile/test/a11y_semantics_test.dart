import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/app/entity_list_screen.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/app/settings_screen.dart';
import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _SlowSettingsClient extends EmcapClient {
  final _gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getAdminSettings() => _gate.future;
}

class _ImmediateSettingsClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getAdminSettings() async => {
        'settings': {'modules': {}, 'tenants': {'default': {}}},
        'editable_paths': [],
        'override_paths': [],
      };

  @override
  Future<Map<String, dynamic>> getAdminOrganizationProfile() async => {
        'profile': {},
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
  Future<Map<String, dynamic>> getPlatformConfig() async => {};

  @override
  Future<Map<String, dynamic>> getTenantIsolationOps() async => {
        'configured_mode': 'shared_database',
        'effective_mode': 'shared_database',
        'has_override': false,
        'reload_hint': '',
      };
}

class _SlowEntityListClient extends EmcapClient {
  final _gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) => _gate.future;

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson();
}

class _ImmediateEntityListClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson();

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [
        {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Alpha', 'active': true},
      ];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async =>
      {'sync_version': 'v1'};

  @override
  Future<Map<String, dynamic>> syncChanges(String entityCode, String since) async =>
      {'count': 0};
}

class _SlowEntityRecordClient extends EmcapClient {
  final _gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) => _gate.future;
}

class _ImmediateEntityRecordClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async => {
        'id': recordId,
        'sku': 'SKU-A',
        'name': 'Alpha',
        'active': true,
        'record_version': 1,
      };

  @override
  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async => [];

  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async =>
      [];

  @override
  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async => [];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [];
}

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  testWidgets('SettingsScreen loading exposes screen reader semantics', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: SettingsScreen(client: _SlowSettingsClient()),
      ),
    );
    await tester.pump();

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('SettingsScreen shows deployment version label', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: SettingsScreen(client: _ImmediateSettingsClient()),
      ),
    );
    await settleSettingsScreen(tester);

    expect(
      find.text(EmcapLocale.t('deployment.version.label', params: {'version': '0.1.0', 'build': '1'})),
      findsOneWidget,
    );
  });

  testWidgets('EntityListScreen loading exposes screen reader semantics', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _SlowEntityListClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await tester.pump();

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('EntityListScreen labels main content landmark when loaded', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _ImmediateEntityListClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')),
      findsOneWidget,
    );
  });

  testWidgets('EntityRecordScreen loading exposes screen reader semantics', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _SlowEntityRecordClient(),
          entityCode: 'PRODUCT',
          title: 'Products',
          recordId: 'prod-1',
        ),
      ),
    );
    await tester.pump();

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('EntityRecordScreen labels main content landmark when loaded', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _ImmediateEntityRecordClient(),
          entityCode: 'PRODUCT',
          title: 'Products',
          recordId: 'prod-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')),
      findsOneWidget,
    );
  });
}
