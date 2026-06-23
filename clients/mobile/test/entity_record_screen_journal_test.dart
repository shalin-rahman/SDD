import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_record_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _JournalClient extends EmcapClient {
  _JournalClient(this._record);

  Map<String, dynamic> _record;
  Map<String, dynamic>? lastUpdate;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    if (entityCode == 'JOURNAL_ENTRY_LINE') {
      return journalEntryLineFormMetadataJson();
    }
    return journalEntryFormMetadataJson();
  }

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async {
    if (_record.isEmpty) return {'id': recordId};
    return Map<String, dynamic>.from(_record);
  }

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async {
    if (entityCode == 'JOURNAL_ENTRY_LINE') {
      return [
        {
          'id': 'jel-1',
          'journal_entry_id': 'je-1',
          'account_id': 'acct-1',
          'debit': 100,
          'credit': 0,
        },
        {
          'id': 'jel-2',
          'journal_entry_id': 'je-1',
          'account_id': 'acct-2',
          'debit': 0,
          'credit': 100,
        },
        {
          'id': 'jel-3',
          'journal_entry_id': 'je-other',
          'debit': 50,
          'credit': 0,
        },
      ];
    }
    if (entityCode == 'ACCOUNT') {
      return [
        {'id': 'acct-1', 'name': 'Cash'},
        {'id': 'acct-2', 'name': 'Revenue'},
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

  @override
  Future<Map<String, dynamic>> createRecord(
    String entityCode,
    Map<String, dynamic> body,
  ) async {
    return {'id': 'new-line', ...body};
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityRecordScreen shows journal lines post and add line for draft entry', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 2400));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _JournalClient({
            'id': 'je-1',
            'reference': 'JE-001',
            'status': 'draft',
            'record_version': 1,
          }),
          entityCode: 'JOURNAL_ENTRY',
          title: 'Journal entries',
          recordId: 'je-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('JE-001'), findsWidgets);
    expect(find.text(EmcapLocale.t('accounting.journal.lines')), findsOneWidget);
    expect(find.text(EmcapLocale.t('accounting.journal.post')), findsOneWidget);
    expect(find.text(EmcapLocale.t('entity.addLine')), findsOneWidget);
    expect(find.textContaining('Cash'), findsOneWidget);
    expect(find.textContaining('Revenue'), findsOneWidget);
    expect(find.text(EmcapLocale.t('accounting.journal.void')), findsNothing);
  });

  testWidgets('EntityRecordScreen post journal confirms and updates status', (tester) async {
    final client = _JournalClient({
      'id': 'je-1',
      'reference': 'JE-001',
      'status': 'draft',
      'record_version': 1,
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: client,
          entityCode: 'JOURNAL_ENTRY',
          title: 'Journal entries',
          recordId: 'je-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('accounting.journal.post')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('accounting.journal.postConfirm')), findsOneWidget);
    await tester.tap(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text(EmcapLocale.t('accounting.journal.post')),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await settleEntityScreen(tester);

    expect(find.byType(AlertDialog), findsNothing);
    expect(client.lastUpdate, {'status': 'posted'});
    expect(find.widgetWithText(TextButton, EmcapLocale.t('accounting.journal.post')), findsNothing);
  });

  testWidgets('EntityRecordScreen void journal confirms and updates status', (tester) async {
    final client = _JournalClient({
      'id': 'je-posted',
      'reference': 'JE-POSTED',
      'status': 'posted',
      'record_version': 2,
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: client,
          entityCode: 'JOURNAL_ENTRY',
          title: 'Journal entries',
          recordId: 'je-posted',
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('accounting.journal.void')), findsOneWidget);
    expect(find.text(EmcapLocale.t('accounting.journal.post')), findsNothing);
    expect(find.text(EmcapLocale.t('entity.addLine')), findsNothing);

    await tester.tap(find.text(EmcapLocale.t('accounting.journal.void')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('accounting.journal.voidConfirm')), findsOneWidget);
    await tester.tap(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text(EmcapLocale.t('accounting.journal.void')),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await settleEntityScreen(tester);

    expect(client.lastUpdate, {'status': 'void'});
  });

  testWidgets('EntityRecordScreen add journal line navigates with journal_entry_id prefill', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _JournalClient({
            'id': 'je-1',
            'reference': 'JE-001',
            'status': 'draft',
            'record_version': 1,
          }),
          entityCode: 'JOURNAL_ENTRY',
          title: 'Journal entries',
          recordId: 'je-1',
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('entity.addLine')));
    await settleEntityScreen(tester);

    expect(find.text(EmcapLocale.t('entity.save')), findsOneWidget);
    expect(find.text('je-1'), findsOneWidget);
  });

  testWidgets('EntityRecordScreen child create applies journal_entry_id query param', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EntityRecordScreen(
          client: _JournalClient({}),
          entityCode: 'JOURNAL_ENTRY_LINE',
          title: 'Journal line',
          creatingNew: true,
          queryParams: const {'journal_entry_id': 'je-prefill'},
        ),
      ),
    );
    await settleEntityScreen(tester);

    expect(find.text('je-prefill'), findsOneWidget);
  });
}
