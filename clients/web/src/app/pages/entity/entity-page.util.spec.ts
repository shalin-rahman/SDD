import { loadEntityMenuTitle } from './entity-page.util';

describe('loadEntityMenuTitle', () => {
  it('returns menu label when entity matches', async () => {
    const api = {
      client: {
        getMenus: jasmine.createSpy('getMenus').and.resolveTo({
          menus: [{ entity_code: 'PRODUCT', label: 'Products' }],
        }),
      },
    };
    await expectAsync(loadEntityMenuTitle(api as never, 'PRODUCT')).toBeResolvedTo('Products');
  });

  it('falls back to entity code when menu missing', async () => {
    const api = {
      client: {
        getMenus: jasmine.createSpy('getMenus').and.resolveTo({ menus: [] }),
      },
    };
    await expectAsync(loadEntityMenuTitle(api as never, 'CUSTOMER')).toBeResolvedTo('CUSTOMER');
  });

  it('falls back to entity code when menus request fails', async () => {
    const api = {
      client: {
        getMenus: jasmine.createSpy('getMenus').and.rejectWith(new Error('network')),
      },
    };
    await expectAsync(loadEntityMenuTitle(api as never, 'LEAD')).toBeResolvedTo('LEAD');
  });
});
