import { I18nService } from './i18n.service';
import { formatInteger } from '../utils/locale-format.util';

describe('I18nService', () => {
  it('switches locale bundles with BCP 47 tags', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.t('nav.signOut')).toBe('Sign out');

    service.setLocale('fr-FR');
    expect(service.t('nav.signOut')).toBe('Déconnexion');
    expect(document.documentElement.lang).toBe('fr-FR');
    expect(localStorage.getItem('emcap-locale')).toBe('fr-FR');
  });

  it('loads Bangla bundle with bn-BD tag', () => {
    localStorage.clear();
    const service = new I18nService();
    service.setLocale('bn-BD');
    expect(service.t('settings.title')).toBe('প্ল্যাটফর্ম সেটিংস');
    expect(localStorage.getItem('emcap-locale')).toBe('bn-BD');
  });

  it('migrates legacy stored locale tags on init', () => {
    localStorage.setItem('emcap-locale', 'bn');
    const service = new I18nService();
    service.init();
    expect(service.locale()).toBe('bn-BD');
    expect(localStorage.getItem('emcap-locale')).toBe('bn-BD');
  });

  it('migrates en and fr legacy aliases on init', () => {
    localStorage.setItem('emcap-locale', 'en');
    const enService = new I18nService();
    enService.init();
    expect(enService.locale()).toBe('en-US');

    localStorage.setItem('emcap-locale', 'fr');
    const frService = new I18nService();
    frService.init();
    expect(frService.locale()).toBe('fr-FR');
  });

  it('falls back to en-US for unknown stored locale', () => {
    localStorage.setItem('emcap-locale', 'de-DE');
    const service = new I18nService();
    service.init();
    expect(service.locale()).toBe('en-US');
  });

  it('returns key when missing in all bundles', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.t('missing.key.xyz')).toBe('missing.key.xyz');
  });

  it('leaves unknown placeholders unchanged', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.t('ux.loading.skeleton', { section: 'Settings' })).toBe('Loading Settings');
    expect(service.t('ux.loading.skeleton')).toBe('Loading {section}');
  });

  it('resolves starter-catalog a11y keys in bn-BD', () => {
    localStorage.clear();
    const service = new I18nService();
    service.setLocale('bn-BD');
    expect(service.t('a11y.skipToContent')).toBe('মূল বিষয়বস্তুতে যান');
  });

  it('plural injects count when params omit it', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.plural('plural.recordCount', 3)).toBe('3 records');
  });

  it('interpolates placeholders', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.t('admin.security.fieldEditTitle', { field: 'sku' })).toBe('Edit field: sku');
  });

  it('selects plural keys and localizes count', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.plural('plural.recordCount', 1, { count: formatInteger(1, 'en-US') })).toBe('1 record');
    expect(service.plural('plural.recordCount', 5, { count: formatInteger(5, 'en-US') })).toBe('5 records');
  });

  it('uses Bengali digits in bn-BD plural messages', () => {
    localStorage.clear();
    const service = new I18nService();
    service.setLocale('bn-BD');
    const one = service.plural('plural.recordCount', 1, { count: formatInteger(1, 'bn-BD') });
    expect(one).toContain('১');
    expect(one).not.toMatch(/[0-9]/);
  });

  it('resolves org.* starter-catalog keys in en-US and fr-FR', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.t('org.displayName.label')).toBe('Company display name');
    expect(service.t('org.logo.alt', { companyName: 'Acme' })).toBe('Acme logo');

    service.setLocale('fr-FR');
    expect(service.t('org.displayName.label')).toBe("Nom affiché de l'entreprise");
    expect(service.t('org.invoice.header')).toBe('En-tête facture');
  });
});
