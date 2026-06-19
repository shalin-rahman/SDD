import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _MovementClient extends EmcapClient {
  _MovementClient(this._record);

  Map<String, dynamic> _record;
  Map<String, dynamic>? lastUpdate;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      stockMovementFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async =>
      Map<String, dynamic>.from(_record);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async {
    if (entityCode == 'STOCK_MOVEMENT_LINE') {
      return [
        {'id': 'line-1', 'movement_id': 'mov-1', 'product_id': 'prod-1', 'quantity': 5},
      ];
    }
    return [];
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
  Future<Map<String, dynamic>> updateRecord(
    String entityCode,
    String recordId,
    Map<String, dynamic> body, {
    int? ifMatch,
  }) async {
    lastUpdate = body;
    _record = {
      ..._record,
      ...body,
      'record_version': (_record['record_version'] as int? ?? 0) + 1,
    };
    return Map<String, dynamic>.from(_record);
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityRecordScreen shows Post movement for draft STOCK_MOVEMENT', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _MovementClient({
            'id': 'mov-1',
            'movement_number': 'MOV-001',
            'status': 'draft',
            'record_version': 1,
          }),
          entityCode: 'STOCK_MOVEMENT',
          title: 'Movements',
          recordId: 'mov-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('MOV-001'), findsWidgets);
    expect(find.text(EmcapLocale.t('entity.postMovement')), findsOneWidget);
    expect(find.text(EmcapLocale.t('entity.movementLinesTitle')), findsOneWidget);
  });

  testWidgets('EntityRecordScreen post movement confirms and updates status', (tester) async {
    final client = _MovementClient({
      'id': 'mov-1',
      'movement_number': 'MOV-001',
      'status': 'draft',
      'record_version': 1,
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: client,
          entityCode: 'STOCK_MOVEMENT',
          title: 'Movements',
          recordId: 'mov-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('entity.postMovement')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.postMovementConfirm')), findsOneWidget);
    await tester.tap(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text(EmcapLocale.t('entity.postMovement')),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await settleEntityScreen(tester);

    expect(find.byType(AlertDialog), findsNothing);
    expect(client.lastUpdate, {'status': 'posted'});
    expect(find.widgetWithText(TextButton, EmcapLocale.t('entity.postMovement')), findsNothing);
  });
}
