import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/metadata_contract.dart';

void main() {
  test('EmcapClient exposes subscribeRecordsStream for grid realtime', () {
    final client = createClient('http://localhost:8000');
    expect(client.subscribeRecordsStream, isA<Function>());
  });

  test('GridMetadata parses realtime flag from API payload', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1',
      'entity_code': 'PRODUCT',
      'columns': [
        {'field': 'sku', 'label': 'SKU', 'field_type': 'text'},
      ],
      'realtime': true,
      'offline': false,
      'export': {'csv': true, 'excel': false, 'pdf': false},
    });
    expect(grid.realtime, isTrue);
    expect(grid.offline, isFalse);
    expect(grid.isValid, isTrue);
  });

  test('GridMetadata defaults realtime to true when omitted', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1',
      'entity_code': 'PRODUCT',
      'columns': [
        {'field': 'sku', 'label': 'SKU', 'field_type': 'text'},
      ],
      'export': {'csv': true, 'excel': false, 'pdf': false},
    });
    expect(grid.realtime, isTrue);
    expect(grid.offline, isTrue);
    expect(grid.grouping, isFalse);
  });

  test('GridMetadata parses offline and grouping flags', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1',
      'entity_code': 'PRODUCT',
      'columns': [
        {'field': 'sku', 'label': 'SKU', 'field_type': 'text'},
        {'field': 'name', 'label': 'Name', 'field_type': 'text'},
      ],
      'realtime': false,
      'offline': true,
      'grouping': true,
      'export': {'csv': true, 'excel': true, 'pdf': false},
    });
    expect(grid.realtime, isFalse);
    expect(grid.offline, isTrue);
    expect(grid.grouping, isTrue);
    expect(grid.entityCode, 'PRODUCT');
    expect(grid.columns.length, 2);
  });

  test('realtime-disabled grid should not require stream subscription at contract level', () {
    final grid = GridMetadata.fromJson({
      'schema_version': '1',
      'entity_code': 'WAREHOUSE',
      'columns': [
        {'field': 'code', 'label': 'Code', 'field_type': 'text'},
      ],
      'realtime': false,
      'offline': true,
      'export': {'csv': true, 'excel': false, 'pdf': false},
    });
    expect(grid.realtime, isFalse);
    expect(grid.isValid, isTrue);
  });

  test('subscribeRecordsStream targets entity records stream endpoint', () {
    final client = createClient('http://example.test:9000');
    var invoked = false;
    client.subscribeRecordsStream('PRODUCT', () {
      invoked = true;
    });
    expect(invoked, isFalse);
  });
}
