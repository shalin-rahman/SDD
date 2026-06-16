import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/widgets/layout_editor_panel.dart';

class _FakeLayoutClient extends EmcapClient {
  _FakeLayoutClient() : super('http://test');

  @override
  Future<List<String>> listEntities() async => ['PRODUCT'];

  @override
  Future<Map<String, dynamic>> getAdminLayoutMetadata(String entityCode) async => {
        'entity_code': entityCode,
        'has_override': false,
        'form': {
          'sections': [
            {
              'code': 'main',
              'fields': [
                {'name': 'sku', 'row': 0, 'col': 0, 'span': 6},
                {'name': 'name', 'row': 0, 'col': 6, 'span': 6},
              ],
            },
          ],
        },
        'grid': {
          'columns': [
            {'field': 'sku', 'label': 'SKU', 'sortable': true, 'filterable': true},
            {'field': 'name', 'label': 'Name', 'sortable': true, 'filterable': true},
          ],
        },
      };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await I18nService.loadBundles();
  });

  testWidgets('LayoutEditorPanel loads entity metadata tabs', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LayoutEditorPanel(client: _FakeLayoutClient()),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('PRODUCT'), findsOneWidget);
    expect(find.byType(TabBar), findsOneWidget);
  });
}
