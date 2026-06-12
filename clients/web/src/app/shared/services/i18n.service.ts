import { Injectable, signal } from '@angular/core';

import bn from '../../../assets/i18n/bn.json';
import en from '../../../assets/i18n/en.json';
import fr from '../../../assets/i18n/fr.json';

export type AppLocale = 'en' | 'fr' | 'bn';

const STORAGE_KEY = 'emcap-locale';

const BUNDLES: Record<AppLocale, Record<string, string>> = {
  en,
  fr,
  bn,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<AppLocale>('en');

  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    const locale: AppLocale = stored === 'fr' ? 'fr' : stored === 'bn' ? 'bn' : 'en';
    this.setLocale(locale);
  }

  setLocale(locale: AppLocale): void {
    this.locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }

  t(key: string): string {
    return BUNDLES[this.locale()][key] ?? BUNDLES.en[key] ?? key;
  }
}
