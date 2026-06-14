import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { AdminRolesComponent } from './admin-roles.component';

describe('AdminRolesComponent', () => {
  let fixture: ComponentFixture<AdminRolesComponent>;
  let listAdminRoles: jasmine.Spy;

  beforeEach(async () => {
    listAdminRoles = jasmine.createSpy('listAdminRoles').and.resolveTo({ roles: [] });
    await TestBed.configureTestingModule({
      imports: [AdminRolesComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listAdminRoles,
              getPermissions: jasmine.createSpy('getPermissions').and.resolveTo({ permissions: [] }),
            },
          },
        },
        {
          provide: LayoutService,
          useValue: { isMobile$: of(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRolesComponent);
  });

  it('renders empty state when no roles', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listAdminRoles).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No roles match your search');
  });
});
