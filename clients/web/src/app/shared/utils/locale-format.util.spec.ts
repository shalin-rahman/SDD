import { formatCurrency, formatDate, formatInteger, resolvePluralCategory } from './locale-format.util';

describe('locale-format.util', () => {
  it('resolves CLDR one/other plural category', () => {
    expect(resolvePluralCategory(1)).toBe('one');
    expect(resolvePluralCategory(0)).toBe('other');
    expect(resolvePluralCategory(2)).toBe('other');
  });

  it('formats integers with Western Arabic numerals for en-US', () => {
    expect(formatInteger(1234567, 'en-US')).toBe('1,234,567');
  });

  it('formats integers with Bengali digits for bn-BD', () => {
    const formatted = formatInteger(1234567, 'bn-BD');
    expect(formatted).toContain('১');
    expect(formatted).not.toMatch(/[0-9]/);
  });

  it('formats currency per locale', () => {
    expect(formatCurrency(42.5, 'USD', 'en-US')).toContain('42.50');
    const bn = formatCurrency(42.5, 'BDT', 'bn-BD');
    expect(bn).toContain('৳');
    expect(bn).not.toMatch(/[0-9]/);
  });

  it('formats dates with Intl', () => {
    const date = new Date('2026-06-19T12:00:00Z');
    expect(formatDate(date, 'en-US')).toMatch(/Jun/);
    expect(formatDate(date, 'bn-BD').length).toBeGreaterThan(0);
  });

  it('formats dates from ISO string and epoch', () => {
    const iso = '2026-06-19T12:00:00Z';
    expect(formatDate(iso, 'en-US')).toMatch(/Jun/);
    expect(formatDate(new Date(iso).getTime(), 'bn-BD').length).toBeGreaterThan(0);
  });

  it('formats fr-FR integers with Western numerals', () => {
    expect(formatInteger(99, 'fr-FR')).toMatch(/99/);
  });
});
