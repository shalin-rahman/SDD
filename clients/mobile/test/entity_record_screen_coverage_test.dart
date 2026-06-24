import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _CreatePrefillClient extends EmcapClient {
  _CreatePrefillClient() : super('http://localhost:8000');

  Map<String, dynamic>? createdBody;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    if (entityCode == 'PURCHASE_ORDER_LINE') {
      return purchaseOrderLineFormMetadataJson();
    }
    return purchaseOrderFormMetadataJson();
  }

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> createRecord(
    String entityCode,
    Map<String, dynamic> data,
  ) async {
    createdBody = data;
    return {'id': 'line-new'};
  }

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      {'id': recordId, 'po_id': 'po-1', 'quantity': 1, 'unit_price': 10};

  @override
  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async => [];

  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async =>
      [];

  @override
  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async => [];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [];

  @override
  Future<EntityRecordsPage> listRecords(String entityCode, {String? q, int? limit, int? offset}) async => const EntityRecordsPage(records: []);
}

class _LoadErrorRecordClient extends EmcapClient {
  _LoadErrorRecordClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async {
    throw Exception('record missing');
  }

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

class _RetryRecordClient extends EmcapClient {
  _RetryRecordClient() : super('http://localhost:8000');

  var attempts = 0;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async {
    attempts++;
    if (attempts == 1) throw Exception('first failure');
    return {'id': recordId, 'sku': 'SKU-1', 'name': 'Sample Product', 'active': true};
  }

  @override
  Future<List<Map<String, dynamic>>> listNotes(String entityCode, String recordId) async => [];

  @override
  Future<List<Map<String, dynamic>>> listDocuments(String entityCode, String recordId) async =>
      [];

  @override
  Future<List<Map<String, dynamic>>> listAudit(String entityCode) async => [];

  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async => [];

  @override
  Future<EntityRecordsPage> listRecords(String entityCode, {String? q, int? limit, int? offset}) async => const EntityRecordsPage(records: []);
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityRecordScreen create prefill applies queryParams', (tester) async {
    final client = _CreatePrefillClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: client,
          entityCode: 'PURCHASE_ORDER_LINE',
          title: 'PO Line',
          creatingNew: true,
          queryParams: {'po_id': 'po-1'},
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.newRecord')), findsOneWidget);
  });

  testWidgets('EntityRecordScreen rebuilds when locale changes', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _CreatePrefillClient(),
          entityCode: 'PURCHASE_ORDER_LINE',
          title: 'PO Line',
          creatingNew: true,
          queryParams: {'po_id': 'po-1'},
        ),
      ),
    );
    await settleEntityScreen(tester);

    final before = EmcapLocale.t('entity.newRecord');
    expect(find.text(before), findsOneWidget);

    await EmcapLocale.setLocale(const Locale('fr', 'FR'));
    await tester.pump();

    expect(find.text(EmcapLocale.t('entity.newRecord')), findsOneWidget);
  });

  testWidgets('EntityRecordScreen shows error when record load fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _LoadErrorRecordClient(),
          entityCode: 'PRODUCT',
          title: 'Products',
          recordId: 'missing',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.textContaining('record missing'), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('common.retry')));
    await settleEntityScreen(tester);
    expect(find.textContaining('record missing'), findsOneWidget);
  });

  testWidgets('EntityRecordScreen retry after load error succeeds', (tester) async {
    final client = _RetryRecordClient();
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
    await settleEntityScreen(tester);
    expect(find.textContaining('first failure'), findsOneWidget);

    await tester.tap(find.text(EmcapLocale.t('common.retry')));
    await settleEntityScreen(tester);
    expect(find.text('Sample Product'), findsOneWidget);
  });
}
