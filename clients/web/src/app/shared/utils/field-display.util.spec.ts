import { formatRecordFieldValue, formatGridCellValue } from './field-display.util';

describe('field-display.util', () => {
  it('formats currency values', () => {
    const formatted = formatRecordFieldValue('unit_price', 'currency', 12.5, 'USD');
    expect(formatted).toContain('12.50');
  });

  it('truncates textarea in grid cells', () => {
    const longText = 'a'.repeat(100);
    expect(formatGridCellValue('description', longText, { fieldType: 'textarea' }).endsWith('…')).toBe(
      true,
    );
  });

  it('formats datetime, checkbox, and empty values', () => {
    expect(formatRecordFieldValue('created_at', 'datetime', '2026-06-14T10:00:00Z')).not.toBe('—');
    expect(formatRecordFieldValue('active', 'checkbox', true)).toBe('Yes');
    expect(formatRecordFieldValue('sku', 'text', '')).toBe('—');
    expect(formatGridCellValue('updated_at', '2026-06-14T10:00:00Z')).not.toBe('—');
    expect(formatGridCellValue('active', false)).toBe('No');
  });

  it('covers lookup, textarea, invalid datetime, and currency fallbacks', () => {
    expect(formatRecordFieldValue('vendor_id', 'lookup', 'v-99')).toBe('v-99');
    expect(formatRecordFieldValue('notes', 'textarea', 'multi\nline')).toBe('multi\nline');
    expect(formatRecordFieldValue('created_at', 'datetime', 'not-a-date')).toBe('not-a-date');
    expect(formatRecordFieldValue('unit_price', 'currency', 'bad', 'EUR')).toBe('bad');
    expect(formatRecordFieldValue('active', 'checkbox', false)).toBe('No');
    expect(formatRecordFieldValue('sku', 'text', null)).toBe('—');
  });

  it('formats grid cells with datetime fields and plain strings', () => {
    expect(formatGridCellValue('deleted_at', '2026-06-14T10:00:00Z')).not.toBe('—');
    expect(formatGridCellValue('sku', 'A-1')).toBe('A-1');
    expect(formatGridCellValue('description', 'short', { fieldType: 'textarea' })).toBe('short');
    expect(formatGridCellValue('price', 10, { fieldType: 'currency', currencyCode: 'USD' })).toContain('10');
    expect(formatGridCellValue('name', '')).toBe('—');
  });
});
