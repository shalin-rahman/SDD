import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_list_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _BulkListClient extends EmcapClient {
  _BulkListClient() : super('http://localhost:8000');

  final deletedIds = <String>[];

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson(bulkActions: true);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [
        {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Alpha'},
        {'id': 'prod-2', 'sku': 'SKU-B', 'name': 'Beta'},
      ];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async =>
      {'sync_version': 'v1'};

  @override
  Future<Map<String, dynamic>> syncChanges(String entityCode, String since) async =>
      {'count': 0};

  @override
  Future<Map<String, dynamic>> deleteRecord(String entityCode, String recordId) async {
    deletedIds.add(recordId);
    return {'id': recordId, 'deleted_at': '2026-06-18T00:00:00Z'};
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityListScreen shows bulk toolbar when bulk_actions enabled', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(body: EntityListScreen(client: _BulkListClient(), entityCode: 'PRODUCT', title: 'Products')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text(EmcapLocale.t('grid.selectAll')), findsOneWidget);
    expect(find.text(EmcapLocale.t('grid.bulkDelete')), findsOneWidget);
    expect(find.text(EmcapLocale.t('grid.bulkExport')), findsOneWidget);
    expect(find.byType(Checkbox), findsWidgets);
  });

  testWidgets('bulk delete button disabled until a row is selected', (tester) async {
    final client = _BulkListClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(body: EntityListScreen(client: client, entityCode: 'PRODUCT', title: 'Products')),
      ),
    );
    await tester.pumpAndSettle();

    final deleteFinder = find.widgetWithText(TextButton, EmcapLocale.t('grid.bulkDelete'));
    final deleteButton = tester.widget<TextButton>(deleteFinder);
    expect(deleteButton.onPressed, isNull);
    expect(client.deletedIds, isEmpty);
  });

  testWidgets('selecting row enables bulk delete and export', (tester) async {
    final client = _BulkListClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(body: EntityListScreen(client: client, entityCode: 'PRODUCT', title: 'Products')),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byType(Checkbox).at(1));
    await tester.pumpAndSettle();

    final deleteFinder = find.widgetWithText(TextButton, EmcapLocale.t('grid.bulkDelete'));
    final deleteButton = tester.widget<TextButton>(deleteFinder);
    expect(deleteButton.onPressed, isNotNull);

    await tester.tap(find.text(EmcapLocale.t('grid.bulkDelete')));
    await tester.pumpAndSettle();

    expect(client.deletedIds, isNotEmpty);
  });

  testWidgets('bulk export copies CSV to clipboard', (tester) async {
  String? clipboardText;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.setData') {
        clipboardText = call.arguments['text'] as String?;
      }
      return null;
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(body: EntityListScreen(client: _BulkListClient(), entityCode: 'PRODUCT', title: 'Products')),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byType(Checkbox).at(1));
    await tester.pumpAndSettle();
    await tester.tap(find.text(EmcapLocale.t('grid.bulkExport')));
    await tester.pumpAndSettle();

    expect(clipboardText, isNotNull);
    expect(clipboardText, contains('sku,name'));
    expect(clipboardText, contains('SKU-A'));

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, null);
  });
}
