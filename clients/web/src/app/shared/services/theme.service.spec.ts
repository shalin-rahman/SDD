import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  it('persists and applies theme mode', () => {
    localStorage.clear();
    const service = new ThemeService();
    service.init();
    expect(service.mode()).toBe('light');

    service.apply('dark');
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('emcap-theme')).toBe('dark');

    service.toggle();
    expect(service.mode()).toBe('light');
  });

  it('applies tenant primary CSS variable', () => {
    const service = new ThemeService();
    service.applyTenantPrimary('#aabbcc');
    expect(document.documentElement.style.getPropertyValue('--emcap-primary')).toBe('#aabbcc');
  });
});
