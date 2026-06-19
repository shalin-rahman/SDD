import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

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
  setUpAll(initMobileScreenTests);

  testWidgets('debug entity record loaded tree', (tester) async {
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

    final texts = tester.widgetList<Text>(find.byType(Text)).map((w) => w.data ?? w.textSpan?.toPlainText()).toList();
    // ignore: avoid_print
    print('TEXTS: $texts');
    // ignore: avoid_print
    print('CPI count: ${find.byType(CircularProgressIndicator).evaluate().length}');
    // ignore: avoid_print
    print('Main semantics: ${find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main')).evaluate().length}');
  });
}
