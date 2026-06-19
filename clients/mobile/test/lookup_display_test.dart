import 'package:flutter_test/flutter_test.dart';

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
    expect(resolveRecordDisplayLabel({}), '');
  });
}
