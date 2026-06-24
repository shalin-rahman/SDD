import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/app/admin_roles_screen.dart';
import 'package:emcap_mobile/app/admin_security_screen.dart';
import 'package:emcap_mobile/app/admin_users_screen.dart';
import 'package:emcap_mobile/app/entity_list_screen.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/app/settings_screen.dart';
import 'package:emcap_mobile/app/workflow_inbox_screen.dart';
import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/fake_emcap_client.dart';
import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _SlowSettingsClient extends EmcapClient {
  final gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getAdminSettings() => gate.future;
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
  final gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) => gate.future;

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
  Future<EntityRecordsPage> listRecords(String entityCode, {String? q, int? limit, int? offset}) async =>
      EntityRecordsPage(records: [
        {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Alpha', 'active': true},
      ]);

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async =>
      {'sync_version': 'v1'};

  @override
  Future<Map<String, dynamic>> syncChanges(String entityCode, String since) async =>
      {'count': 0};
}

class _SlowEntityRecordClient extends EmcapClient {
  final gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) => gate.future;
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

class _EntityRecordWithDocumentClient extends _ImmediateEntityRecordClient {
  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async => [
        {'id': 'doc-1', 'filename': 'spec.txt', 'version': 1},
      ];

  @override
  Future<EntityRecordsPage> listRecords(String entityCode, {String? q, int? limit, int? offset}) async =>
      const EntityRecordsPage(records: []);
}

class _InvoiceA11yClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      invoiceFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async => {
        'id': recordId,
        'invoice_number': 'INV-001',
        'amount': 250.0,
        'balance_due': 250.0,
        'status': 'sent',
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

class _SlowAdminUsersClient extends EmcapClient {
  final gate = Completer<List<Map<String, dynamic>>>();

  @override
  Future<List<Map<String, dynamic>>> listAdminUsers() => gate.future;

  @override
  Future<List<Map<String, dynamic>>> listAdminRoles() async => [];
}

class _SlowAdminRolesClient extends EmcapClient {
  final gate = Completer<List<Map<String, dynamic>>>();

  @override
  Future<List<Map<String, dynamic>>> listAdminRoles() => gate.future;

  @override
  Future<List<String>> getPermissions() async => [];
}

class _SlowAdminSecurityClient extends EmcapClient {
  final gate = Completer<Map<String, dynamic>>();

  @override
  Future<Map<String, dynamic>> getAdminSecurityPolicies() => gate.future;

  @override
  Future<List<Map<String, dynamic>>> getAdminAbacPolicies() async => [];

  @override
  Future<List<String>> getPermissions() async => [];
}

class _SlowWorkflowInboxClient extends EmcapClient {
  final gate = Completer<List<Map<String, dynamic>>>();

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) => gate.future;
}

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  testWidgets('SettingsScreen loading exposes screen reader semantics', (tester) async {
    final client = _SlowSettingsClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: SettingsScreen(client: client),
      ),
    );
    await settleLoadingSemantics(tester);

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
    final client = _SlowEntityListClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: client,
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await settleLoadingSemantics(tester);

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
    final client = _SlowEntityRecordClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: client,
          entityCode: 'PRODUCT',
          title: 'Products',
          recordId: 'prod-1',
        ),
      ),
    );
    await settleLoadingSemantics(tester);

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

  testWidgets('AdminUsersScreen loading exposes screen reader semantics', (tester) async {
    final client = _SlowAdminUsersClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: AdminUsersScreen(client: client),
      ),
    );
    await settleLoadingSemantics(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('AdminUsersScreen labels main content landmark when loaded', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: AdminUsersScreen(client: FakeEmcapClient()),
      ),
    );
    await settleAdminScreen(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')),
      findsOneWidget,
    );
  });

  testWidgets('AdminRolesScreen loading exposes screen reader semantics', (tester) async {
    final client = _SlowAdminRolesClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: AdminRolesScreen(client: client),
      ),
    );
    await settleLoadingSemantics(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('AdminRolesScreen labels main content landmark when loaded', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: AdminRolesScreen(client: FakeEmcapClient()),
      ),
    );
    await settleAdminScreen(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')),
      findsOneWidget,
    );
  });

  testWidgets('AdminSecurityScreen loading exposes screen reader semantics', (tester) async {
    final client = _SlowAdminSecurityClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(body: AdminSecurityScreen(client: client)),
      ),
    );
    await settleLoadingSemantics(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('AdminSecurityScreen labels main content landmark when loaded', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(body: AdminSecurityScreen(client: FakeEmcapClient())),
      ),
    );
    await settleAdminScreen(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')),
      findsOneWidget,
    );
  });

  testWidgets('WorkflowInboxScreen loading exposes screen reader semantics', (tester) async {
    final client = _SlowWorkflowInboxClient();
    addTearDown(() {
      if (!client.gate.isCompleted) {
        client.gate.completeError(StateError('test finished'));
      }
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(client: client),
      ),
    );
    await settleLoadingSemantics(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
      findsOneWidget,
    );
  });

  testWidgets('WorkflowInboxScreen labels main content landmark when loaded', (tester) async {
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(client: FakeEmcapClient()),
      ),
    );
    await settleWorkflowInbox(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')),
      findsOneWidget,
    );
  });

  testWidgets('WorkflowInboxScreen Detail button exposes semantics label', (tester) async {
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(client: FakeEmcapClient()),
      ),
    );
    await settleWorkflowInbox(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('platform.workflow.detail')),
      findsAtLeast(1),
    );
  });

  testWidgets('EntityRecordScreen document preview exposes button semantics', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _EntityRecordWithDocumentClient(),
          entityCode: 'PRODUCT',
          title: 'Products',
          recordId: 'prod-1',
        ),
      ),
    );
    await settleEntityRecordDetail(tester);
    final documentsHeader = find.text('${EmcapLocale.t('record.documents')} (1)');
    await pumpUntilFound(tester, documentsHeader, maxPumps: 120);
    expect(documentsHeader, findsOneWidget);

    final preview = find.byTooltip(EmcapLocale.t('record.previewDocument'));
    await scrollAccountTo(tester, preview);

    expect(preview, findsOneWidget);
  });

  testWidgets('EntityRecordScreen INVOICE print exposes button semantics', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _InvoiceA11yClient(),
          entityCode: 'INVOICE',
          title: 'Invoices',
          recordId: 'inv-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(
      find.bySemanticsLabel(EmcapLocale.t('sales.invoice.print')),
      findsAtLeast(1),
    );
  });
}
