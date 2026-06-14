import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/field_display.dart';

void main() {
  test('formats currency values', () {
    final formatted = formatRecordFieldValue('unit_price', 'currency', 12.5, currencyCode: 'USD');
    expect(formatted, contains('12.50'));
  });

  test('truncates textarea in grid cells', () {
    final longText = 'a' * 100;
    final formatted = formatGridCellValue('description', longText, fieldType: 'textarea');
    expect(formatted.endsWith('…'), isTrue);
  });

  test('formats LEAD status enum and active boolean in grid cells', () {
    expect(formatGridCellValue('status', 'qualified', fieldType: 'select'), 'qualified');
    expect(formatGridCellValue('active', true), 'Yes');
    expect(formatGridCellValue('active', false), 'No');
  });
}
