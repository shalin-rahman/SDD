import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _InvoiceClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      invoiceFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {
        'modules': {},
        'organization_profile': {
          'display_name': 'Acme Billing',
          'invoice': {
            'header': '{{display_name}} Invoice',
            'footer': 'Thank you for your business.',
          },
        },
      };

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

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  testWidgets('INVOICE record shows print action with org header in dialog', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _InvoiceClient(),
          entityCode: 'INVOICE',
          title: 'Invoices',
          recordId: 'inv-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('sales.invoice.print')), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('sales.invoice.print')));
    await tester.pumpAndSettle();

    expect(find.text('Acme Billing Invoice'), findsOneWidget);
    expect(find.text('Thank you for your business.'), findsOneWidget);
    expect(find.text('INV-001'), findsWidgets);
  });
}
