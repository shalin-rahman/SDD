import { resolvePageTitle } from './page-title.util';

describe('page-title.util', () => {
  const platformLinks = [
    { label: 'Reports', route: '/app/reports', visible: true },
    { label: 'Workflow tasks', route: '/app/workflow', visible: true },
  ];

  it('resolves platform route title', () => {
    expect(resolvePageTitle('/app/reports', platformLinks, [])).toBe('Reports');
  });

  it('resolves entity route from menu label', () => {
    const menus = [{ entity_code: 'PRODUCT', label: 'Products' }];
    expect(resolvePageTitle('/app/entity/PRODUCT', platformLinks, menus)).toBe('Products');
  });

  it('falls back to entity code or EMCAP', () => {
    expect(resolvePageTitle('/app/entity/UNKNOWN', platformLinks, [])).toBe('UNKNOWN');
    expect(resolvePageTitle('/app', platformLinks, [])).toBe('EMCAP');
  });
});
