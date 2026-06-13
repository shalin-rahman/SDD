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
}
