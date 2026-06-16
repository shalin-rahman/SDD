import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { of, BehaviorSubject } from 'rxjs';



import { EmcapApiService } from '../../services/emcap-api.service';

import { I18nService } from '../../shared/services/i18n.service';

import { LayoutService } from '../../shared/services/layout.service';

import { AdminRolesComponent } from './admin-roles.component';



describe('AdminRolesComponent', () => {

  let fixture: ComponentFixture<AdminRolesComponent>;

  let listAdminRoles: jasmine.Spy;
  let isMobile$: BehaviorSubject<boolean>;



  beforeEach(async () => {

    listAdminRoles = jasmine.createSpy('listAdminRoles').and.resolveTo({ roles: [] });
    isMobile$ = new BehaviorSubject(false);

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

          useValue: { isMobile$: isMobile$.asObservable() },

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

  it('renders admin breadcrumbs', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.page-header__breadcrumbs')?.textContent).toContain('Admin');
  });

  it('filters roles and validates create form', async () => {
    listAdminRoles.and.resolveTo({
      roles: [
        { id: 'r1', code: 'viewer', name: 'Viewer', permissions: ['customer.read'] },
        { id: 'r2', code: 'admin', name: 'Admin', permissions: ['*.*'] },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.searchTerm = 'viewer';
    expect(cmp.filteredRoles.length).toBe(1);
    cmp.startCreate();
    expect(cmp.creating).toBeTrue();
    expect(cmp.validateForm()).toBeFalse();
    cmp.draftCode = 'ops';
    cmp.draftName = 'Ops';
    expect(cmp.validateForm()).toBeTrue();
  });

  it('saves new and existing roles and handles failures', async () => {
    const createAdminRole = jasmine.createSpy('createAdminRole').and.resolveTo({ id: 'r-new' });
    const updateAdminRole = jasmine.createSpy('updateAdminRole').and.resolveTo({});
    listAdminRoles.and.resolveTo({
      roles: [{ id: 'r1', code: 'viewer', name: 'Viewer', permissions: ['customer.read'] }],
    });
    TestBed.inject(EmcapApiService).client.createAdminRole = createAdminRole;
    TestBed.inject(EmcapApiService).client.updateAdminRole = updateAdminRole;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.startCreate();
    cmp.draftCode = 'ops';
    cmp.draftName = 'Ops';
    cmp.draftPermissions = ['customer.read'];
    await cmp.save();
    expect(createAdminRole).toHaveBeenCalled();

    cmp.selectRole(cmp.roles[0]);
    cmp.draftName = 'Viewer updated';
    await cmp.save();
    expect(updateAdminRole).toHaveBeenCalled();

    updateAdminRole.and.rejectWith(new Error('save failed'));
    await cmp.save();
    expect(cmp.saveError).toContain('save failed');
  });

  it('reloads roles and supports mobile detail panel', async () => {
    listAdminRoles.and.rejectWith(new Error('load failed'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.loadError).toContain('load failed');

    listAdminRoles.and.resolveTo({
      roles: [{ id: 'r1', code: 'viewer', name: 'Viewer', permissions: ['customer.read'] }],
    });
    isMobile$.next(true);
    await fixture.componentInstance.reload();
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.selectRole(cmp.roles[0]);
    expect(cmp.mobileDetailOpen).toBeTrue();
    cmp.onPermissionsChange(['customer.read', 'customer.create']);
    expect(cmp.fieldErrors.permissions).toBeUndefined();
    cmp.closeDetail();
    expect(cmp.selectedId).toBeNull();
    cmp.searchTerm = 'customer';
    expect(cmp.filteredRoles.length).toBe(1);
  });
});

