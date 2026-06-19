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
    expect(formatGridCellValue('status', 'won', fieldType: 'select'), 'won');
    expect(formatGridCellValue('active', true), 'Yes');
    expect(formatGridCellValue('active', false), 'No');
  });

  test('formats CONTACT email and lead lookup in grid cells', () {
    expect(formatGridCellValue('email', 'bob@example.com'), 'bob@example.com');
    expect(formatGridCellValue('lead_id', 'lead-1', fieldType: 'lookup'), 'lead-1');
  });

  test('formatRecordFieldValue handles null empty datetime and checkbox', () {
    expect(formatRecordFieldValue('name', 'text', null), '—');
    expect(formatRecordFieldValue('name', 'text', ''), '—');
    expect(formatRecordFieldValue('active', 'checkbox', true), 'Yes');
    expect(formatRecordFieldValue('active', 'checkbox', false), 'No');
    expect(
      formatRecordFieldValue('created_at', 'datetime', '2026-06-19T12:00:00Z', locale: 'en_US'),
      isNotEmpty,
    );
    expect(formatRecordFieldValue('notes', 'textarea', 'long text'), 'long text');
    expect(formatRecordFieldValue('warehouse_id', 'lookup', 'wh-1'), 'wh-1');
  });

  test('formatGridCellValue formats datetime system fields', () {
    expect(
      formatGridCellValue('updated_at', '2026-06-19T12:00:00Z', locale: 'en_US'),
      isNotEmpty,
    );
  });

  test('formatGridCellValue delegates currency formatting', () {
    expect(
      formatGridCellValue('amount', 99.5, fieldType: 'currency', currencyCode: 'USD', locale: 'en_US'),
      contains('99.50'),
    );
  });

  test('formatRecordFieldValue returns raw value for unparseable currency', () {
    expect(formatRecordFieldValue('amount', 'currency', 'not-a-number'), 'not-a-number');
  });
}
