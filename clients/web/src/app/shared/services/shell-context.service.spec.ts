import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import { ShellContextService } from './shell-context.service';
import { ThemeService } from './theme.service';

describe('ShellContextService', () => {
  let service: ShellContextService;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        ShellContextService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getPlatformConfig: jasmine.createSpy('getPlatformConfig').and.resolveTo({
                modules: { workflow: { enabled: true } },
                organization_profile: {
                  secondary_color: '#336699',
                  favicon_url: 'https://cdn.example/favicon.ico',
                },
              }),
              getBaseUrl: jasmine.createSpy('getBaseUrl').and.returnValue('http://localhost:8000'),
              getMe: jasmine.createSpy('getMe').and.resolveTo({ permissions: ['*.*'] }),
              getHealth: jasmine.createSpy('getHealth').and.resolveTo({
                multi_tenant: false,
                tenant_strategy: 'shared_database',
              }),
              listTenants: jasmine.createSpy('listTenants').and.resolveTo({
                tenants: [{ id: 'default', name: 'Default' }],
                white_label: false,
              }),
              getMenus: jasmine.createSpy('getMenus').and.resolveTo({
                menus: [
                  {
                    code: 'products',
                    label: 'Products',
                    entity_code: 'PRODUCT',
                    module: 'INVENTORY',
                    permission: 'product.read',
                  },
                ],
              }),
              setTenantId: jasmine.createSpy('setTenantId'),
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            getTenantId: () => 'default',
            getToken: () => 'token',
            setSession: jasmine.createSpy('setSession'),
          },
        },
        {
          provide: Router,
          useValue: { url: '/app', navigate },
        },
        {
          provide: ThemeService,
          useValue: {
            applyTenantPrimary: jasmine.createSpy('applyTenantPrimary'),
            applyTenantSecondary: jasmine.createSpy('applyTenantSecondary'),
            applyFavicon: jasmine.createSpy('applyFavicon'),
          },
        },
      ],
    });
    service = TestBed.inject(ShellContextService);
  });

  it('loads platform config, menus, and tenant state', async () => {
    const theme = TestBed.inject(ThemeService) as unknown as {
      applyTenantSecondary: jasmine.Spy;
      applyFavicon: jasmine.Spy;
    };
    const state = await service.load();

    expect(state.platformLinks.length).toBeGreaterThan(0);
    expect(state.menus.length).toBe(1);
    expect(service.navGroups().length).toBeGreaterThan(0);
    expect(state.tenantLine).toContain('shared_database');
    expect(theme.applyTenantSecondary).toHaveBeenCalledWith('#336699');
    expect(theme.applyFavicon).toHaveBeenCalledWith('https://cdn.example/favicon.ico');
  });

  it('selectTenant updates api client and auth session', () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(EmcapApiService);
    service.selectTenant('tenant-b');
    expect(api.client.setTenantId).toHaveBeenCalledWith('tenant-b');
    expect(auth.setSession).toHaveBeenCalledWith('token', 'tenant-b');
    expect(service.selectedTenant()).toBe('tenant-b');
  });

  it('sets navLoadError when menus fail to load', async () => {
    const api = TestBed.inject(EmcapApiService);
    (api.client.getMenus as jasmine.Spy).and.rejectWith(new Error('menus down'));
    await service.load();
    expect(service.navLoadError()).toBe('shell.nav.loadFailed');
    expect(service.navGroups()).toEqual([]);
  });

  it('sets navEmpty when filtered menus are empty', async () => {
    const api = TestBed.inject(EmcapApiService);
    (api.client.getMenus as jasmine.Spy).and.resolveTo({ menus: [] });
    await service.load();
    expect(service.navEmpty()).toBeTrue();
    expect(service.navLoadError()).toBe('');
  });
});
