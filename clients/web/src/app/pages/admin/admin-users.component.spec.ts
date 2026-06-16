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

  it('creates and updates admin users', async () => {
    const createUser = jasmine.createSpy('createAdminUser').and.resolveTo({ id: 'u2' });
    const updateUser = jasmine.createSpy('updateAdminUser').and.resolveTo({ id: 'u1' });
    TestBed.inject(EmcapApiService).client.createAdminUser = createUser;
    TestBed.inject(EmcapApiService).client.updateAdminUser = updateUser;

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

    const cmp = fixture.componentInstance;
    cmp.selectUser(cmp.users[0]);
    cmp.draftTenantId = 'tenant-b';
    await cmp.save();
    expect(updateUser).toHaveBeenCalled();

    cmp.startCreate();
    cmp.draftUsername = 'bob';
    cmp.draftPassword = 'secret';
    await cmp.save();
    expect(createUser).toHaveBeenCalled();
  });

  it('handles reload and save failures plus deactivate guard', async () => {
    listAdminUsers.and.rejectWith(new Error('users down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('users down');

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
    await fixture.componentInstance.reload();

    const cmp = fixture.componentInstance;
    cmp.searchTerm = 'alice';
    expect(cmp.filteredUsers.length).toBe(1);
    await cmp.deactivateSelected();

    cmp.selectUser(cmp.users[0]);
    const updateUser = jasmine.createSpy('updateAdminUser').and.rejectWith(new Error('save failed'));
    TestBed.inject(EmcapApiService).client.updateAdminUser = updateUser;
    await cmp.save();
    expect(cmp.loadError).toContain('save failed');
  });
});
