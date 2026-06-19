import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/bulk_grid_util.dart';

void main() {
  final page = [
    {'id': 'a', 'name': 'Alpha'},
    {'id': 'b', 'name': 'Beta'},
    {'id': '', 'name': 'NoId'},
  ];

  test('recordIdsFromPage skips empty ids', () {
    expect(recordIdsFromPage(page), ['a', 'b']);
  });

  test('toggleRecordSelection adds and removes ids', () {
    var selected = toggleRecordSelection({}, 'a');
    expect(selected, {'a'});
    selected = toggleRecordSelection(selected, 'a');
    expect(selected, isEmpty);
  });

  test('toggleSelectAllOnPage selects then deselects page ids', () {
    var selected = toggleSelectAllOnPage({}, page);
    expect(selected, containsAll(['a', 'b']));
    selected = toggleSelectAllOnPage(selected, page);
    expect(selected, isEmpty);
  });

  test('isPageFullySelected reflects page selection state', () {
    expect(isPageFullySelected({'a', 'b'}, page), isTrue);
    expect(isPageFullySelected({'a'}, page), isFalse);
    expect(isPageFullySelected({}, []), isFalse);
  });

  test('selectedRecordsFromPage filters working set', () {
    final selected = selectedRecordsFromPage({'a'}, page);
    expect(selected, hasLength(1));
    expect(selected.first['name'], 'Alpha');
  });

  test('buildGridExportCsv joins columns and rows', () {
    final csv = buildGridExportCsv(['id', 'name'], [
      {'id': 'a', 'name': 'Alpha'},
    ]);
    expect(csv, contains('id,name'));
    expect(csv, contains('a,Alpha'));
  });

  test('shouldRunBulkDelete requires enabled flag and selection', () {
    expect(shouldRunBulkDelete(bulkActionsEnabled: true, selected: {'a'}), isTrue);
    expect(shouldRunBulkDelete(bulkActionsEnabled: false, selected: {'a'}), isFalse);
    expect(shouldRunBulkDelete(bulkActionsEnabled: true, selected: {}), isFalse);
  });

  test('buildGridExportCsv handles missing column values', () {
    final csv = buildGridExportCsv(['id', 'name'], [
      {'id': 'a'},
    ]);
    expect(csv.split('\n').last, 'a,');
  });

  test('toggleSelectAllOnPage no-op when page has no ids', () {
    expect(toggleSelectAllOnPage({'a'}, [{'name': 'No id'}]), {'a'});
  });
}
