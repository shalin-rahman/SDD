import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _LifecycleClient extends EmcapClient {
  _LifecycleClient(this._record);

  Map<String, dynamic> _record;
  var restoreCalled = false;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      Map<String, dynamic>.from(_record);

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
  Future<Map<String, dynamic>> restoreRecord(String entityCode, String recordId) async {
    restoreCalled = true;
    _record = {
      'id': recordId,
      'sku': 'SKU-A',
      'name': 'Alpha',
      'active': true,
      'record_version': 2,
      'deleted_at': null,
    };
    return Map<String, dynamic>.from(_record);
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityRecordScreen shows restore banner for soft-deleted record', (tester) async {
    final client = _LifecycleClient({
      'id': 'prod-1',
      'sku': 'SKU-A',
      'name': 'Alpha',
      'active': true,
      'record_version': 1,
      'deleted_at': '2026-06-18T10:00:00Z',
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
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.restore')), findsWidgets);
    expect(find.textContaining('2026-06-18T10:00:00Z'), findsOneWidget);
    expect(find.text(EmcapLocale.t('entity.delete')), findsNothing);
  });

  testWidgets('EntityRecordScreen restore action calls client restoreRecord', (tester) async {
    final client = _LifecycleClient({
      'id': 'prod-1',
      'sku': 'SKU-A',
      'name': 'Alpha',
      'active': true,
      'record_version': 1,
      'deleted_at': '2026-06-18T10:00:00Z',
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
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('entity.restore')).first);
    await settleEntityScreen(tester);

    expect(client.restoreCalled, isTrue);
    expect(find.textContaining('2026-06-18T10:00:00Z'), findsNothing);
  });
}
