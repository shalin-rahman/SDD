import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/bulk_grid_util.dart';

void main() {
  group('GridMetadata bulk_actions contract', () {
    test('parses bulk_actions flag', () {
      final grid = GridMetadata.fromJson({
        'schema_version': '1',
        'entity_code': 'PRODUCT',
        'columns': [
          {'field': 'sku', 'label': 'SKU', 'field_type': 'text'},
        ],
        'export': {'csv': true, 'excel': false, 'pdf': false},
        'bulk_actions': true,
      });
      expect(grid.bulkActions, isTrue);
      expect(grid.isValid, isTrue);
    });

    test('defaults bulk_actions to false', () {
      final grid = GridMetadata.fromJson({
        'schema_version': '1',
        'entity_code': 'WAREHOUSE',
        'columns': [
          {'field': 'code', 'label': 'Code', 'field_type': 'text'},
        ],
        'export': {'csv': true, 'excel': false, 'pdf': false},
      });
      expect(grid.bulkActions, isFalse);
    });

    test('PRODUCT fixture enables bulk_actions with realtime/offline', () {
      final grid = GridMetadata.fromJson({
        'schema_version': '1.0',
        'entity_code': 'PRODUCT',
        'columns': [
          {'field': 'sku', 'label': 'SKU', 'field_type': 'text'},
          {'field': 'name', 'label': 'Name', 'field_type': 'text'},
        ],
        'export': {'csv': true, 'excel': true, 'pdf': true},
        'bulk_actions': true,
        'realtime': true,
        'offline': true,
      });
      expect(grid.bulkActions, isTrue);
      expect(grid.realtime, isTrue);
      expect(grid.offline, isTrue);
    });
  });

  group('bulk_grid_util selection', () {
    const page = [
      {'id': '1', 'sku': 'A-1'},
      {'id': '2', 'sku': 'B-2'},
      {'id': '', 'sku': 'no-id'},
    ];

    test('recordIdsFromPage skips empty ids', () {
      expect(recordIdsFromPage(page), ['1', '2']);
    });

    test('toggleRecordSelection adds and removes ids', () {
      var selected = <String>{};
      selected = toggleRecordSelection(selected, '1');
      expect(selected, {'1'});
      selected = toggleRecordSelection(selected, '1');
      expect(selected, isEmpty);
    });

    test('toggleSelectAllOnPage selects then deselects page', () {
      var selected = <String>{};
      selected = toggleSelectAllOnPage(selected, page);
      expect(selected, {'1', '2'});
      selected = toggleSelectAllOnPage(selected, page);
      expect(selected, isEmpty);
    });

    test('isPageFullySelected reflects partial selection', () {
      expect(isPageFullySelected({'1'}, page), isFalse);
      expect(isPageFullySelected({'1', '2'}, page), isTrue);
      expect(isPageFullySelected(<String>{}, page), isFalse);
    });

    test('selectedRecordsFromPage filters working set', () {
      final selected = {'2'};
      final rows = selectedRecordsFromPage(selected, page);
      expect(rows.length, 1);
      expect(rows.first['sku'], 'B-2');
    });

    test('buildGridExportCsv emits header and rows', () {
      final csv = buildGridExportCsv(['sku', 'name'], [
        {'sku': 'A', 'name': 'Alpha'},
        {'sku': 'B', 'name': 'Beta'},
      ]);
      expect(csv, 'sku,name\nA,Alpha\nB,Beta');
    });

    test('shouldRunBulkDelete requires flag and selection', () {
      expect(shouldRunBulkDelete(bulkActionsEnabled: true, selected: {'1'}), isTrue);
      expect(shouldRunBulkDelete(bulkActionsEnabled: false, selected: {'1'}), isFalse);
      expect(shouldRunBulkDelete(bulkActionsEnabled: true, selected: {}), isFalse);
    });
  });
}
