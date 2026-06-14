import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { AdminSecurityComponent } from './admin-security.component';

describe('AdminSecurityComponent', () => {
  let fixture: ComponentFixture<AdminSecurityComponent>;
  let getAdminSecurityPolicies: jasmine.Spy;

  beforeEach(async () => {
    getAdminSecurityPolicies = jasmine.createSpy('getAdminSecurityPolicies').and.resolveTo({
      entities: [
        {
          code: 'PRODUCT',
          read_permission: 'inventory.read',
          row_access: 'tenant',
          fields: [{ name: 'unit_price', read_roles: ['inventory.access'], access: 'restricted' }],
        },
      ],
      rules: { row_access: 'Row rule', field_access: 'Field rule' },
    });

    await TestBed.configureTestingModule({
      imports: [AdminSecurityComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getAdminSecurityPolicies,
              getAdminAbacPolicies: jasmine
                .createSpy('getAdminAbacPolicies')
                .and.resolveTo({ policies: [] }),
              getPermissions: jasmine.createSpy('getPermissions').and.resolveTo({ permissions: [] }),
              getMe: jasmine.createSpy('getMe').and.resolveTo({ permissions: ['admin.security.write'] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSecurityComponent);
  });

  it('renders field matrix for selected entity', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getAdminSecurityPolicies).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('unit_price');
    expect(fixture.nativeElement.textContent).toContain('inventory.access');
  });
});
