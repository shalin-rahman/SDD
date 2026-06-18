import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';

void main() {
  test('GridMetadata parses bulk_actions flag', () {
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

  test('GridMetadata defaults bulk_actions to false', () {
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

  test('PRODUCT grid fixture enables bulk_actions in contract', () {
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
}
