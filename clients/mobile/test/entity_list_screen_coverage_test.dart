import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_list_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';
import 'support/screen_test_harness.dart';

class _InvalidMetadataClient extends EmcapClient {
  _InvalidMetadataClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async => {'sections': []};

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async => {'columns': []};

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async => {};
}

class _LoadErrorClient extends EmcapClient {
  _LoadErrorClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    throw Exception('network down');
  }
}

class _ReloadErrorClient extends EmcapClient {
  _ReloadErrorClient() : super('http://localhost:8000');

  var listCalls = 0;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson(bulkActions: true);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async {
    listCalls++;
    if (listCalls > 1) {
      throw Exception('reload failed');
    }
    return [
      {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Alpha'},
    ];
  }

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async => {};
}

class _BulkDeleteErrorClient extends EmcapClient {
  _BulkDeleteErrorClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson(bulkActions: true);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [
        {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Alpha'},
      ];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async => {};

  @override
  Future<Map<String, dynamic>> deleteRecord(String entityCode, String recordId) async {
    throw Exception('delete denied');
  }
}

class _EmptyListClient extends EmcapClient {
  _EmptyListClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson();

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async => {};
}

class _RetryMetadataClient extends EmcapClient {
  _RetryMetadataClient() : super('http://localhost:8000');

  var attempts = 0;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async {
    attempts++;
    if (attempts == 1) return {'sections': []};
    return productFormMetadataJson();
  }

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson();

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [
        {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Sample'},
      ];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async => {};
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('EntityListScreen shows invalid metadata error', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _InvalidMetadataClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));

    expect(find.text(EmcapLocale.t('entity.invalidMetadata')), findsOneWidget);
  });

  testWidgets('EntityListScreen shows load error message', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _LoadErrorClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));

    expect(find.textContaining('network down'), findsOneWidget);
  });

  testWidgets('EntityListScreen select-all toggles row checkboxes', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _BulkDeleteErrorClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.text(EmcapLocale.t('grid.selectAll')));
    await tester.pump();

    final checkboxes = tester.widgetList<Checkbox>(find.byType(Checkbox));
    expect(checkboxes.every((box) => box.value == true), isTrue);

    await tester.tap(find.text(EmcapLocale.t('grid.selectAll')));
    await tester.pump();

    final cleared = tester.widgetList<Checkbox>(find.byType(Checkbox));
    expect(cleared.every((box) => box.value != true), isTrue);
  });

  testWidgets('EntityListScreen bulk delete failure shows error banner', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _BulkDeleteErrorClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.tap(find.byType(Checkbox).at(1));
    await tester.pump();
    await tester.tap(find.text(EmcapLocale.t('grid.bulkDelete')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text(EmcapLocale.t('entity.bulkDeleteFailed')), findsOneWidget);
  });

  testWidgets('EntityListScreen reload failure shows snackbar', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _ReloadErrorClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await settleEntityScreen(tester);

    await tester.enterText(find.byType(TextField).first, 'search');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.byType(SnackBar), findsOneWidget);
  });

  testWidgets('EntityListScreen empty grid shows create action', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _EmptyListClient(),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));

    expect(find.text(EmcapLocale.t('grid.empty')), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('entity.new')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('entity.newRecord')), findsOneWidget);
  });

  testWidgets('EntityListScreen retry reloads after metadata error', (tester) async {
    final client = _RetryMetadataClient();
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
    await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));
    expect(find.text(EmcapLocale.t('entity.invalidMetadata')), findsOneWidget);

    await tester.tap(find.text(EmcapLocale.t('common.retry')));
    await tester.pumpAndSettle();
    expect(find.text('Sample'), findsOneWidget);
  });
}
