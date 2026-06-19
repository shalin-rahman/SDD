import { Injectable, signal } from '@angular/core';

import bnBd from '../../../assets/i18n/bn-BD.json';
import enUs from '../../../assets/i18n/en-US.json';
import frFr from '../../../assets/i18n/fr-FR.json';

export type AppLocale = 'en-US' | 'bn-BD' | 'fr-FR';

export interface I18nParams {
  [key: string]: string | number;
}

const STORAGE_KEY = 'emcap-locale';

/** One-release read-path aliases for legacy short tags. */
const LEGACY_LOCALE_ALIAS: Record<string, AppLocale> = {
  en: 'en-US',
  bn: 'bn-BD',
  fr: 'fr-FR',
};

const BUNDLES: Record<AppLocale, Record<string, string>> = {
  'en-US': enUs,
  'bn-BD': bnBd,
  'fr-FR': frFr,
};

const DEFAULT_LOCALE: AppLocale = 'en-US';

function normalizeLocale(stored: string | null): AppLocale {
  if (!stored) {
    return DEFAULT_LOCALE;
  }
  if (stored in BUNDLES) {
    return stored as AppLocale;
  }
  return LEGACY_LOCALE_ALIAS[stored] ?? DEFAULT_LOCALE;
}

function interpolate(template: string, params?: I18nParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value !== undefined ? String(value) : `{${token}}`;
  });
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<AppLocale>(DEFAULT_LOCALE);

  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.setLocale(normalizeLocale(stored));
  }

  setLocale(locale: AppLocale | keyof typeof LEGACY_LOCALE_ALIAS): void {
    const canonical = normalizeLocale(locale);
    this.locale.set(canonical);
    localStorage.setItem(STORAGE_KEY, canonical);
    document.documentElement.lang = canonical;
  }

  t(key: string, params?: I18nParams): string {
    const bundle = BUNDLES[this.locale()];
    const template = bundle[key] ?? BUNDLES[DEFAULT_LOCALE][key] ?? key;
    return interpolate(template, params);
  }

  plural(baseKey: string, count: number, params?: I18nParams): string {
    const category = count === 1 ? 'one' : 'other';
    const merged: I18nParams = { ...params };
    if (merged.count === undefined) {
      merged.count = count;
    }
    return this.t(`${baseKey}.${category}`, merged);
  }
}
