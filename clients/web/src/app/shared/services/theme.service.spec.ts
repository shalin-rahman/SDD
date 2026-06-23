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

  it('persists and applies density mode', () => {
    localStorage.clear();
    const service = new ThemeService();
    service.init();
    expect(service.density()).toBe('comfortable');
    expect(document.documentElement.dataset['density']).toBe('comfortable');

    service.applyDensity('compact');
    expect(service.density()).toBe('compact');
    expect(document.documentElement.dataset['density']).toBe('compact');
    expect(localStorage.getItem('emcap-density')).toBe('compact');

    service.toggleDensity();
    expect(service.density()).toBe('comfortable');
  });

  it('applies tenant primary CSS variable', () => {
    const service = new ThemeService();
    service.applyTenantPrimary('#aabbcc');
    expect(document.documentElement.style.getPropertyValue('--emcap-primary')).toBe('#aabbcc');
  });

  it('applies tenant secondary and favicon when configured', () => {
    const service = new ThemeService();
    service.applyTenantSecondary('#ff6600');
    expect(document.documentElement.style.getPropertyValue('--emcap-secondary')).toBe('#ff6600');

    service.applyFavicon('https://cdn.example/favicon.ico');
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(link?.href).toBe('https://cdn.example/favicon.ico');
  });
});
