import type { MenuItem } from '../api/emcap-client';
import {
  buildPlatformLinks,
  filterMenus,
  groupMenusByModule,
  hasPermission,
} from './shell-nav.util';

describe('shell-nav.util', () => {
  const sampleMenus: MenuItem[] = [
    { code: 'products', label: 'Products', entity_code: 'PRODUCT', module: 'INVENTORY' },
    { code: 'customers', label: 'Customers', entity_code: 'CUSTOMER', module: 'CRM' },
    { code: 'products2', label: 'Products B', entity_code: 'PRODUCT_B', module: 'INVENTORY' },
  ];

  it('groups menus by module', () => {
    const groups = groupMenusByModule(sampleMenus);
    expect(groups.length).toBe(2);
    expect(groups[0].moduleCode).toBe('CRM');
    expect(groups[1].moduleCode).toBe('INVENTORY');
    expect(groups[1].items.length).toBe(2);
  });

  it('filters menus by permission', () => {
    const filtered = filterMenus(sampleMenus, ['customer.read'], {});
    expect(filtered.length).toBe(1);
    expect(filtered[0].entity_code).toBe('CUSTOMER');

    const allowed = filterMenus(sampleMenus, ['*.*'], {});
    expect(allowed.length).toBe(3);
  });

  it('matches wildcard permissions', () => {
    expect(hasPermission(['inventory.*'], 'product.read')).toBeFalse();
    expect(hasPermission(['product.*'], 'product.read')).toBeTrue();
  });

  it('hides platform links when module disabled', () => {
    const links = buildPlatformLinks({ workflow: { enabled: false }, ai: { enabled: false } });
    const workflow = links.find((l) => l.route === '/app/workflow');
    const assistant = links.find((l) => l.route === '/app/assistant');
    expect(workflow?.visible).toBeFalse();
    expect(assistant?.visible).toBeFalse();
  });

  it('adds admin and settings links for admin permissions', () => {
    const links = buildPlatformLinks({}, ['admin.*']);
    expect(links.some((l) => l.route === '/app/admin/users')).toBeTrue();
    expect(links.some((l) => l.route === '/app/settings')).toBeTrue();
  });

  it('hides admin links for read-only users', () => {
    const links = buildPlatformLinks({}, ['customer.read']);
    expect(links.some((l) => l.route === '/app/admin/users')).toBeFalse();
  });
});
