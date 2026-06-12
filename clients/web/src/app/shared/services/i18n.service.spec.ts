import { I18nService } from './i18n.service';

describe('I18nService', () => {
  it('switches locale bundles', () => {
    localStorage.clear();
    const service = new I18nService();
    service.init();
    expect(service.t('nav.signOut')).toBe('Sign out');

    service.setLocale('fr');
    expect(service.t('nav.signOut')).toBe('Déconnexion');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem('emcap-locale')).toBe('fr');
  });

  it('loads Bangla bundle', () => {
    localStorage.clear();
    const service = new I18nService();
    service.setLocale('bn');
    expect(service.t('settings.title')).toBe('প্ল্যাটফর্ম সেটিংস');
    expect(localStorage.getItem('emcap-locale')).toBe('bn');
  });
});
