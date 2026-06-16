import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccountComponent } from './account.component';
import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';
import { ThemeService } from '../../shared/services/theme.service';

describe('AccountComponent', () => {
  let fixture: ComponentFixture<AccountComponent>;
  let getMe: jasmine.Spy;
  let getPermissions: jasmine.Spy;
  let getRoles: jasmine.Spy;

  beforeEach(async () => {
    getMe = jasmine.createSpy('getMe').and.resolveTo({
      user_id: 'u1',
      email: 'admin@example.com',
    });
    getPermissions = jasmine.createSpy('getPermissions').and.resolveTo({
      permissions: ['customer.read'],
    });
    getRoles = jasmine.createSpy('getRoles').and.resolveTo({
      roles: [{ code: 'admin', name: 'Administrator' }],
    });

    await TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: AuthService,
          useValue: { getTenantId: () => 'default', setSession: jasmine.createSpy('setSession') },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              getMe,
              getPermissions,
              getRoles,
              enrollMfa: jasmine.createSpy('enrollMfa').and.resolveTo({ secret: 'SECRET' }),
              verifyMfa: jasmine
                .createSpy('verifyMfa')
                .and.resolveTo({ access_token: 'token-2' }),
            },
          },
        },
        {
          provide: ThemeService,
          useValue: {
            mode: () => 'light',
            density: () => 'comfortable',
            toggle: jasmine.createSpy('toggle'),
            toggleDensity: jasmine.createSpy('toggleDensity'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountComponent);
  });

  it('loads profile, permissions, and roles', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getMe).toHaveBeenCalled();
    expect(getPermissions).toHaveBeenCalled();
    expect(getRoles).toHaveBeenCalled();
    expect(fixture.componentInstance.email).toBe('admin@example.com');
    expect(fixture.componentInstance.permissions).toEqual(['customer.read']);
    expect(fixture.componentInstance.loading).toBeFalse();
  });

  it('roleLabel prefers code then name', () => {
    expect(fixture.componentInstance.roleLabel({ code: 'admin' })).toBe('admin');
    expect(fixture.componentInstance.roleLabel({ name: 'Viewer' })).toBe('Viewer');
  });

  it('onLocaleChange updates i18n for supported locales', () => {
    const i18n = TestBed.inject(I18nService);
    spyOn(i18n, 'setLocale');
    fixture.componentInstance.onLocaleChange('fr');
    expect(i18n.setLocale).toHaveBeenCalledWith('fr');
    fixture.componentInstance.onLocaleChange('xx');
    expect(i18n.setLocale).toHaveBeenCalledTimes(1);
  });

  it('handles load failure and MFA success paths', async () => {
    getMe.and.rejectWith(new Error('profile down'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error).toContain('profile down');

    getMe.and.resolveTo({ username: 'bob' });
    await fixture.componentInstance.load();
    expect(fixture.componentInstance.userId).toBe('bob');

    fixture.componentInstance.enrollMfa();
    await fixture.whenStable();
    expect(fixture.componentInstance.mfaSecret).toContain('SECRET');

    fixture.componentInstance.mfaCode = '123456';
    fixture.componentInstance.verifyMfa();
    await fixture.whenStable();
    expect(fixture.componentInstance.mfaVerified).toBeTrue();
  });
});
