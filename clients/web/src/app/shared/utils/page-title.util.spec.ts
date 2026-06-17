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

  it('resolves report deep link from menu label', () => {
    const menus = [{ entity_code: 'PRODUCT', label: 'Low Stock Report', report_code: 'LOW_STOCK' }];
    expect(resolvePageTitle('/app/reports?code=LOW_STOCK', platformLinks, menus)).toBe('Low Stock Report');
  });

  it('resolves entity record route from menu label', () => {
    const menus = [{ entity_code: 'PRODUCT', label: 'Products' }];
    expect(resolvePageTitle('/app/entity/PRODUCT/abc-123', platformLinks, menus)).toBe('Products');
  });

  it('falls back to entity code or translated default title', () => {
    expect(resolvePageTitle('/app/entity/UNKNOWN', platformLinks, [])).toBe('UNKNOWN');
    const translate = (key: string) => (key === 'shell.pageTitle.default' ? 'EMCAP' : key);
    expect(resolvePageTitle('/app', platformLinks, [], translate)).toBe('EMCAP');
  });

  it('translates platform link titles via labelKey', () => {
    const links = [
      { labelKey: 'platform.reports.title', label: 'Reports', route: '/app/reports', visible: true },
    ];
    const translate = (key: string) => (key === 'platform.reports.title' ? 'Rapports' : key);
    expect(resolvePageTitle('/app/reports', links, [], translate)).toBe('Rapports');
    expect(resolvePageTitle('/app', links, [], (k) => (k === 'shell.pageTitle.default' ? 'Accueil' : k))).toBe(
      'Accueil',
    );
  });
});
