import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/utils/lookup_display.dart';

void main() {
  test('resolveRecordDisplayLabel prefers name', () {
    expect(
      resolveRecordDisplayLabel({'id': '1', 'code': 'WH-01', 'name': 'Main Warehouse'}),
      'Main Warehouse',
    );
  });

  test('resolveRecordDisplayLabel falls back to id', () {
    expect(resolveRecordDisplayLabel({'id': 'rec-99'}), 'rec-99');
  });

  test('currencyCodeFromField defaults to USD', () {
    expect(currencyCodeFromField(null), 'USD');
    expect(currencyCodeFromField({'currency_code': 'EUR'}), 'EUR');
  });

  test('resolveRecordDisplayLabel uses code and sku fallbacks', () {
    expect(resolveRecordDisplayLabel({'id': '1', 'code': 'WH-01'}), 'WH-01');
    expect(resolveRecordDisplayLabel({'id': '1', 'sku': 'SKU-1'}), 'SKU-1');
    expect(resolveRecordDisplayLabel({'id': '1', 'title': 'Widget'}), 'Widget');
  });

  test('resolveRecordDisplayLabel handles empty map', () {
    expect(resolveRecordDisplayLabel({}), '—');
  });

  test('lookupEntityFromField returns null for empty lookup_entity', () {
    expect(lookupEntityFromField(null), isNull);
    expect(lookupEntityFromField({}), isNull);
    expect(lookupEntityFromField({'lookup_entity': ''}), isNull);
    expect(lookupEntityFromField({'lookup_entity': 'PRODUCT'}), 'PRODUCT');
  });

  test('columnFieldType and columnCurrencyCode read grid metadata', () {
    final metadata = GridMetadata.fromJson({
      'schema_version': '1.0',
      'entity_code': 'PRODUCT',
      'columns': [
        {
          'field': 'unit_price',
          'label': 'Unit Price',
          'sortable': true,
          'filterable': true,
          'field_type': 'currency',
          'currency_code': 'EUR',
        },
        {'field': 'name', 'label': 'Name', 'sortable': true, 'filterable': true},
      ],
      'export': {'csv': true, 'excel': true, 'pdf': false},
    });
    expect(columnFieldType(metadata, 'unit_price'), 'currency');
    expect(columnCurrencyCode(metadata, 'unit_price'), 'EUR');
    expect(columnFieldType(metadata, 'name'), isNull);
    expect(columnCurrencyCode(metadata, 'missing'), isNull);
  });
}
