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
              }),
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
          useValue: { applyTenantPrimary: jasmine.createSpy('applyTenantPrimary') },
        },
      ],
    });
    service = TestBed.inject(ShellContextService);
  });

  it('loads platform config, menus, and tenant state', async () => {
    const state = await service.load();

    expect(state.platformLinks.length).toBeGreaterThan(0);
    expect(state.menus.length).toBe(1);
    expect(service.navGroups().length).toBeGreaterThan(0);
    expect(state.tenantLine).toContain('shared_database');
  });

  it('selectTenant updates api client and auth session', () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(EmcapApiService);
    service.selectTenant('tenant-b');
    expect(api.client.setTenantId).toHaveBeenCalledWith('tenant-b');
    expect(auth.setSession).toHaveBeenCalledWith('token', 'tenant-b');
    expect(service.selectedTenant()).toBe('tenant-b');
  });
});
