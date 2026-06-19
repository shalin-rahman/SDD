import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/widgets/emcap_badge.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _LeadRecordClient extends EmcapClient {
  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async => leadFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async => {
        'id': recordId,
        'company': 'Globex',
        'contact_name': 'Pat',
        'status': 'won',
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

  testWidgets('LEAD EntityRecordScreen shows company em dash contact hero', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _LeadRecordClient(),
          entityCode: 'LEAD',
          title: 'Leads',
          recordId: 'lead-2',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('Globex — Pat'), findsOneWidget);
    expect(find.byType(EmcapStatusChip), findsOneWidget);
    expect(find.text('Active'), findsOneWidget);
  });

  testWidgets('LEAD record screen shows main section fields', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.indigo, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _LeadRecordClient(),
          entityCode: 'LEAD',
          title: 'Leads',
          recordId: 'lead-2',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('Company'), findsWidgets);
    expect(find.text('Globex'), findsWidgets);
    expect(find.text('won'), findsOneWidget);
  });
}
