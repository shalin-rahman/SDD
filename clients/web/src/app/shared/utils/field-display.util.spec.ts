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
});
