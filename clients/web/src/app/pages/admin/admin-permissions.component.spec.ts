import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { AdminPermissionsComponent } from './admin-permissions.component';

describe('AdminPermissionsComponent', () => {
  let fixture: ComponentFixture<AdminPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPermissionsComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listAdminRoles: jasmine.createSpy('listAdminRoles').and.resolveTo({ roles: [] }),
              getPermissions: jasmine.createSpy('getPermissions').and.resolveTo({ permissions: [] }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPermissionsComponent);
  });

  it('shows loading panel while fetching', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.loading).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Loading');
  });

  it('renders empty state when no permission groups', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No permissions are registered');
  });

  it('renders admin breadcrumbs', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.page-header__breadcrumbs')?.textContent).toContain('Admin');
  });

  it('shows retry on load failure', async () => {
    TestBed.inject(EmcapApiService).client.listAdminRoles = jasmine
      .createSpy('listAdminRoles')
      .and.rejectWith(new Error('permissions down'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError).toContain('permissions down');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });
});
