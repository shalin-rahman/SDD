import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of, BehaviorSubject } from 'rxjs';

import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { LayoutService } from '../../shared/services/layout.service';
import { AdminSecurityComponent } from './admin-security.component';

describe('AdminSecurityComponent', () => {
  let fixture: ComponentFixture<AdminSecurityComponent>;
  let getAdminSecurityPolicies: jasmine.Spy;
  let isMobile$: BehaviorSubject<boolean>;

  beforeEach(async () => {
    isMobile$ = new BehaviorSubject(false);
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
        {
          provide: LayoutService,
          useValue: { isMobile$: isMobile$.asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSecurityComponent);
  });

  it('shows loading then entity list', async () => {
    expect(fixture.componentInstance.loading).toBeTrue();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();
    expect(getAdminSecurityPolicies).toHaveBeenCalled();
  });

  it('renders field matrix for selected entity', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getAdminSecurityPolicies).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('unit_price');
    expect(fixture.nativeElement.textContent).toContain('inventory.access');
  });

  it('renders admin breadcrumbs', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.page-header__breadcrumbs')?.textContent).toContain('Admin');
  });

  it('supports mobile detail panel and closeDetail', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    isMobile$.next(true);
    const cmp = fixture.componentInstance;
    cmp.selectEntity('PRODUCT');
    expect(cmp.mobileDetailOpen).toBeTrue();
    expect(cmp.detailOpen).toBeTrue();
    cmp.closeDetail();
    expect(cmp.mobileDetailOpen).toBeFalse();
  });

  it('shows read-only hint when user cannot edit', async () => {
    TestBed.inject(EmcapApiService).client.getMe = jasmine
      .createSpy('getMe')
      .and.resolveTo({ permissions: ['inventory.read'] });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.canEditSecurity).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('read-only access');
  });

  it('renders empty entity state when no policies', async () => {
    getAdminSecurityPolicies.and.resolveTo({ entities: [], rules: {} });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No entity security policies');
  });

  it('saves ABAC policies when user can edit', async () => {
    const updateAbac = jasmine.createSpy('updateAdminAbacPolicies').and.resolveTo({ policies: [] });
    TestBed.inject(EmcapApiService).client.updateAdminAbacPolicies = updateAbac;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.addAbacPolicy();
    cmp.abacPolicies[0].permission = 'customer.read';
    await cmp.saveAbac();

    expect(updateAbac).toHaveBeenCalled();
    expect(cmp.abacSaved).toBeTrue();
  });

  it('validates ABAC permission before save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.addAbacPolicy();
    await cmp.saveAbac();

    expect(cmp.abacFieldErrors[0]?.permission).toBeTruthy();
  });

  it('opens and saves field access override', async () => {
    const updateField = jasmine.createSpy('updateAdminFieldAccess').and.resolveTo({
      entity_code: 'PRODUCT',
      field_name: 'unit_price',
      read_roles: ['inventory.access'],
      access: 'restricted',
    });
    TestBed.inject(EmcapApiService).client.updateAdminFieldAccess = updateField;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.canEditSecurity = true;
    cmp.openFieldEdit('unit_price', ['inventory.access']);
    cmp.onFieldPermissionsChange(['inventory.access', 'finance.access']);
    await cmp.saveFieldAccess();

    expect(updateField).toHaveBeenCalled();
    expect(cmp.editingFieldName).toBeNull();
  });

  it('tests ABAC permission and field access labels', async () => {
    const checkAuth = jasmine.createSpy('checkAuth').and.resolveTo({ allowed: true });
    TestBed.inject(EmcapApiService).client.checkAuth = checkAuth;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.fieldAccessLabel('restricted')).toBeTruthy();
    expect(cmp.fieldAccessLabel('open')).toBeTruthy();
    cmp.abacTestPermission = 'customer.read';
    await cmp.testAbacPermission();
    expect(cmp.abacTestAllowed).toBeTrue();

    spyOn(window, 'confirm').and.returnValue(true);
    const before = cmp.abacPolicies.length;
    cmp.addAbacPolicy();
    cmp.removeAbacPolicy(before);
    expect(cmp.abacPolicies.length).toBe(before);
  });

  it('denies edit access when getMe fails and blocks save', async () => {
    TestBed.inject(EmcapApiService).client.getMe = jasmine
      .createSpy('getMe')
      .and.rejectWith(new Error('unauthorized'));

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.canEditSecurity).toBeFalse();
    cmp.openFieldEdit('unit_price', []);
    expect(cmp.editingFieldName).toBeNull();

    cmp.addAbacPolicy();
    const updateAbac = jasmine.createSpy('updateAdminAbacPolicies');
    TestBed.inject(EmcapApiService).client.updateAdminAbacPolicies = updateAbac;
    await cmp.saveAbac();
    expect(updateAbac).not.toHaveBeenCalled();
  });

  it('handles reload and ABAC load errors', async () => {
    getAdminSecurityPolicies.and.rejectWith(new Error('policies down'));
    TestBed.inject(EmcapApiService).client.getAdminAbacPolicies = jasmine
      .createSpy('getAdminAbacPolicies')
      .and.rejectWith(new Error('abac down'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError).toContain('policies down');
    expect(fixture.nativeElement.textContent).toContain('Retry');

    getAdminSecurityPolicies.and.resolveTo({
      entities: [
        {
          code: 'PRODUCT',
          read_permission: 'inventory.read',
          row_access: 'tenant',
          fields: [{ name: 'unit_price', read_roles: ['inventory.access'], access: 'restricted' }],
        },
      ],
      rules: {},
    });
    await fixture.componentInstance.reload();
    fixture.detectChanges();
    await fixture.componentInstance.loadAbac();
    fixture.detectChanges();
    expect(fixture.componentInstance.abacError).toContain('abac down');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });

  it('clears ABAC field errors on permission change and blocks delete confirm', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.addAbacPolicy();
    cmp.validateAbac();
    expect(cmp.abacFieldErrors[0]?.permission).toBeTruthy();
    cmp.abacPolicies[0].permission = 'x';
    cmp.onAbacPermissionChange(0);
    expect(cmp.abacFieldErrors[0]).toBeUndefined();

    spyOn(window, 'confirm').and.returnValue(false);
    const len = cmp.abacPolicies.length;
    cmp.removeAbacPolicy(0);
    expect(cmp.abacPolicies.length).toBe(len);
  });

  it('handles field access save failure and ABAC test error', async () => {
    const updateField = jasmine
      .createSpy('updateAdminFieldAccess')
      .and.rejectWith(new Error('field save failed'));
    const checkAuth = jasmine.createSpy('checkAuth').and.rejectWith(new Error('auth down'));
    TestBed.inject(EmcapApiService).client.updateAdminFieldAccess = updateField;
    TestBed.inject(EmcapApiService).client.checkAuth = checkAuth;

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.canEditSecurity = true;
    cmp.openFieldEdit('unit_price', ['inventory.access']);
    await cmp.saveFieldAccess();
    expect(cmp.fieldSaveError).toContain('field save failed');

    cmp.abacTestPermission = '';
    await cmp.testAbacPermission();
    expect(checkAuth).not.toHaveBeenCalled();

    cmp.abacTestPermission = 'customer.read';
    await cmp.testAbacPermission();
    expect(cmp.abacTestError).toContain('auth down');
  });

  it('handles saveAbac API error, denied ABAC test, and entity selection', async () => {
    const updateAbac = jasmine
      .createSpy('updateAdminAbacPolicies')
      .and.rejectWith(new Error('abac save failed'));
    const checkAuth = jasmine.createSpy('checkAuth').and.resolveTo({ allowed: false });
    TestBed.inject(EmcapApiService).client.updateAdminAbacPolicies = updateAbac;
    TestBed.inject(EmcapApiService).client.checkAuth = checkAuth;
    TestBed.inject(EmcapApiService).client.getPermissions = jasmine
      .createSpy('getPermissions')
      .and.rejectWith(new Error('perms down'));

    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    expect(cmp.allPermissions).toEqual([]);

    cmp.addAbacPolicy();
    cmp.abacPolicies[0].permission = 'customer.read';
    await cmp.saveAbac();
    expect(cmp.abacError).toContain('abac save failed');

    cmp.abacTestPermission = 'customer.read';
    await cmp.testAbacPermission();
    expect(cmp.abacTestAllowed).toBeFalse();

    cmp.canEditSecurity = true;
    cmp.openFieldEdit('unit_price', ['inventory.access']);
    cmp.selectEntity('PRODUCT');
    expect(cmp.editingFieldName).toBeNull();
  });

  it('closes field edit when field disappears after reload', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    cmp.canEditSecurity = true;
    cmp.openFieldEdit('unit_price', ['inventory.access']);
    getAdminSecurityPolicies.and.resolveTo({
      entities: [
        {
          code: 'PRODUCT',
          read_permission: 'inventory.read',
          row_access: 'tenant',
          fields: [],
        },
      ],
      rules: {},
    });
    await cmp.reload();
    expect(cmp.editingFieldName).toBeNull();

    getAdminSecurityPolicies.and.rejectWith('policies down');
    await cmp.reload();
    expect(cmp.loadError).toBe('Failed to load security policies');
  });
});
