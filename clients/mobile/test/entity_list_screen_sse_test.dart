import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/entity_list_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_metadata_fixtures.dart';

class _SseListClient extends EmcapClient {
  _SseListClient({required this.changeCount, this.realtime = true});

  final int changeCount;
  final bool realtime;
  var streamSubscribed = false;

  @override
  Future<Map<String, dynamic>> getFormMetadata(String entityCode) async =>
      productFormMetadataJson();

  @override
  Future<Map<String, dynamic>> getGridMetadata(String entityCode) async =>
      productGridMetadataJson(realtime: realtime, offline: true);

  @override
  Future<List<Map<String, dynamic>>> listRecords(String entityCode, {String? q}) async => [
        {'id': 'prod-1', 'sku': 'SKU-A', 'name': 'Alpha'},
      ];

  @override
  Future<Map<String, dynamic>> syncSnapshot(String entityCode) async =>
      {'sync_version': 'snap-42'};

  @override
  Future<Map<String, dynamic>> syncChanges(String entityCode, String since) async =>
      {'count': changeCount};

  @override
  void subscribeRecordsStream(String entityCode, void Function() onEvent) {
    streamSubscribed = true;
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await I18nService.loadBundles();
  });

  testWidgets('EntityListScreen shows offline snapshot status', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _SseListClient(changeCount: 0),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('snap-42'), findsOneWidget);
    expect(find.textContaining(EmcapLocale.t('grid.offlineStatus')), findsOneWidget);
  });

  testWidgets('EntityListScreen shows pending offline changes banner', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(
            client: _SseListClient(changeCount: 3),
            entityCode: 'PRODUCT',
            title: 'Products',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining(EmcapLocale.t('grid.offlinePrefix')), findsOneWidget);
    expect(find.textContaining('3'), findsOneWidget);
    expect(find.textContaining(EmcapLocale.t('grid.changes')), findsOneWidget);
    expect(find.textContaining(EmcapLocale.t('grid.snapshot')), findsOneWidget);
  });

  testWidgets('EntityListScreen shows realtime label when stream subscribed', (tester) async {
    final client = _SseListClient(changeCount: 0, realtime: true);
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: EntityListScreen(client: client, entityCode: 'PRODUCT', title: 'Products'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(client.streamSubscribed, isTrue);
    expect(find.text(EmcapLocale.t('settings.grid.realtime')), findsOneWidget);
  });
}
