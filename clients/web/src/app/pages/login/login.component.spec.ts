import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';
import { I18nService } from '../../shared/services/i18n.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let login: jasmine.Spy;
  let navigate: jasmine.Spy;
  let getAuthProviders: jasmine.Spy;

  beforeEach(async () => {
    login = jasmine.createSpy('login').and.resolveTo({
      access_token: 'token',
      tenant_id: 'default',
    });
    getAuthProviders = jasmine
      .createSpy('getAuthProviders')
      .and.resolveTo({ providers: ['username_password', 'oauth'] });
    navigate = jasmine.createSpy('navigate');

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            setSession: jasmine.createSpy('setSession'),
            getTenantId: () => 'default',
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              login,
              getAuthProviders,
              loginOAuth: jasmine.createSpy('loginOAuth').and.resolveTo({
                access_token: 'oauth-token',
                tenant_id: 'default',
              }),
            },
          },
        },
        {
          provide: Router,
          useValue: { navigate },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
  });

  it('loads providers and password login stores session', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getAuthProviders).toHaveBeenCalled();
    expect(fixture.componentInstance.providers).toContain('oauth');

    await fixture.componentInstance.onSubmit();
    expect(login).toHaveBeenCalledWith('admin', 'admin123');
    expect(navigate).toHaveBeenCalledWith(['/app']);
  });

  it('oauth login uses client credentials when enabled', async () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(EmcapApiService);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.selectProvider('oauth');
    await fixture.componentInstance.onOAuth();
    expect(api.client.loginOAuth).toHaveBeenCalledWith('emcap-client', 'emcap-secret');
    expect(auth.setSession).toHaveBeenCalledWith('oauth-token', 'default');
  });

  it('oauth shows i18n error when provider disabled', async () => {
    getAuthProviders.and.resolveTo({ providers: ['username_password'] });
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.componentInstance.onOAuth();
    expect(fixture.componentInstance.error).toContain('OAuth');
  });

  it('shows session expired message and falls back when providers fail to load', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            setSession: jasmine.createSpy('setSession'),
            getTenantId: () => 'default',
          },
        },
        {
          provide: EmcapApiService,
          useValue: {
            client: {
              login,
              getAuthProviders: jasmine.createSpy('getAuthProviders').and.rejectWith(new Error('offline')),
              loginOAuth: jasmine.createSpy('loginOAuth'),
            },
          },
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ sessionExpired: '1' }) } },
        },
      ],
    }).compileComponents();

    const expiredFixture = TestBed.createComponent(LoginComponent);
    expiredFixture.detectChanges();
    await expiredFixture.whenStable();
    expect(expiredFixture.componentInstance.error).toContain('session expired');
    expect(expiredFixture.componentInstance.providers).toEqual(['username_password']);
  });

  it('selectProvider clears errors and providerLabel falls back to raw code', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.error = 'old';
    fixture.componentInstance.selectProvider('oauth');
    expect(fixture.componentInstance.error).toBe('');
    expect(fixture.componentInstance.providerLabel('custom_provider')).toBe('custom_provider');
  });

  it('redirects when already authenticated and surfaces login errors', async () => {
    spyOn(TestBed.inject(AuthService), 'isAuthenticated').and.returnValue(true);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/app']);

    login.and.rejectWith(new Error('bad credentials'));
    const errorFixture = TestBed.createComponent(LoginComponent);
    errorFixture.detectChanges();
    await errorFixture.whenStable();
    await errorFixture.componentInstance.onSubmit();
    expect(errorFixture.componentInstance.error).toContain('bad credentials');

    (TestBed.inject(EmcapApiService).client.loginOAuth as jasmine.Spy).and.rejectWith('oauth down');
    await errorFixture.componentInstance.onOAuth();
    expect(errorFixture.componentInstance.error).toBeTruthy();
  });
});
