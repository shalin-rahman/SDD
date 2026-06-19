import type { AppLocale } from '../services/i18n.service';

export type LocaleTag = AppLocale;

export function resolvePluralCategory(count: number): 'one' | 'other' {
  return count === 1 ? 'one' : 'other';
}

export function formatInteger(value: number, localeTag: LocaleTag): string {
  const options: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };
  if (localeTag === 'bn-BD') {
    options.numberingSystem = 'beng';
  }
  return new Intl.NumberFormat(localeTag, options).format(value);
}

export function formatCurrency(value: number, currency: string, localeTag: LocaleTag): string {
  const options: Intl.NumberFormatOptions = { style: 'currency', currency };
  if (localeTag === 'bn-BD') {
    options.numberingSystem = 'beng';
  }
  return new Intl.NumberFormat(localeTag, options).format(value);
}

export function formatDate(
  value: Date | number | string,
  localeTag: LocaleTag,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(localeTag, options).format(date);
}
