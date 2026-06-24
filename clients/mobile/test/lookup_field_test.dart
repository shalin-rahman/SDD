import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/widgets/lookup_field.dart';

class _LookupClient extends EmcapClient {
  _LookupClient({this.failList = false}) : super('http://localhost:8000');

  final bool failList;

  @override
  Future<Map<String, dynamic>> getRecord(String entityCode, String recordId) async {
    if (entityCode == 'WAREHOUSE' && recordId == 'wh-1') {
      return {'id': 'wh-1', 'code': 'WH-01', 'name': 'Main'};
    }
    return {'id': recordId, 'code': recordId, 'name': recordId};
  }

  @override
  Future<EntityRecordsPage> listRecords(String entityCode, {String? q, int? limit, int? offset}) async {
    if (failList) throw Exception('list failed');
    return EntityRecordsPage(records: [
      {'id': 'wh-1', 'code': 'WH-01', 'name': 'Main'},
      {'id': 'wh-2', 'code': 'WH-02', 'name': 'Secondary'},
    ]);
  }
}

final _warehouseLookupField = FormFieldMetadata(
  name: 'primary_warehouse',
  label: 'Warehouse',
  fieldType: 'lookup',
  lookupEntity: 'WAREHOUSE',
);

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await I18nService.loadBundles();
  });

  testWidgets('LookupField resolves selected record label', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: LookupField(
            client: _LookupClient(),
            field: _warehouseLookupField,
            label: 'Warehouse',
            value: 'wh-1',
            onChanged: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Main'), findsOneWidget);
    expect(find.text('${EmcapLocale.t('field.lookup.choose')} WAREHOUSE'), findsOneWidget);
  });

  testWidgets('LookupPickerDialog selects a record', (tester) async {
    String? selectedId;
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: LookupField(
            client: _LookupClient(),
            field: _warehouseLookupField,
            label: 'Warehouse',
            onChanged: (v) => selectedId = v,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('${EmcapLocale.t('field.lookup.choose')} WAREHOUSE'));
    await tester.pumpAndSettle();

    expect(find.text('${EmcapLocale.t('field.lookup.title')} WAREHOUSE'), findsOneWidget);
    await tester.tap(find.text('Secondary'));
    await tester.pumpAndSettle();

    expect(selectedId, 'wh-2');
  });

  testWidgets('LookupField clear button resets value', (tester) async {
    String? value = 'wh-1';
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: LookupField(
            client: _LookupClient(),
            field: _warehouseLookupField,
            label: 'Warehouse',
            value: value,
            onChanged: (v) => value = v,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(EmcapLocale.t('field.lookup.clear')));
    await tester.pumpAndSettle();

    expect(value, isNull);
  });

  testWidgets('LookupPickerDialog shows load failure message', (tester) async {
    final failingClient = _LookupClient(failList: true);
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: Scaffold(
          body: LookupField(
            client: failingClient,
            field: _warehouseLookupField,
            label: 'Warehouse',
            onChanged: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('${EmcapLocale.t('field.lookup.choose')} WAREHOUSE'));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('field.lookup.loadFailed')), findsOneWidget);
  });
}
