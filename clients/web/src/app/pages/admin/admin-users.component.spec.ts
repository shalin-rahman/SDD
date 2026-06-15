import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { AdminUsersComponent } from './admin-users.component';

describe('AdminUsersComponent', () => {
  let fixture: ComponentFixture<AdminUsersComponent>;
  let listAdminUsers: jasmine.Spy;

  beforeEach(async () => {
    listAdminUsers = jasmine.createSpy('listAdminUsers').and.resolveTo({ users: [] });
    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              listAdminUsers,
              listAdminRoles: jasmine.createSpy('listAdminRoles').and.resolveTo({ roles: [] }),
            },
          },
        },
        {
          provide: LayoutService,
          useValue: { isMobile$: of(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersComponent);
  });

  it('renders empty state when no users', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listAdminUsers).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No users match your search');
  });

  it('renders admin breadcrumbs and status badges', async () => {
    listAdminUsers.and.resolveTo({
      users: [
        {
          id: 'u1',
          username: 'alice',
          tenant_id: 'default',
          active: true,
          roles: [{ code: 'admin', name: 'Admin' }],
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-header__breadcrumbs')?.textContent).toContain('Admin');
    expect(el.querySelector('.emcap-badge--on')).toBeTruthy();
  });
});
