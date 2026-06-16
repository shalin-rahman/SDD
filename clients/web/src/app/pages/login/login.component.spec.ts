import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { EmcapApiService } from '../../services/emcap-api.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let login: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    login = jasmine.createSpy('login').and.resolveTo({
      access_token: 'token',
      tenant_id: 'default',
    });
    navigate = jasmine.createSpy('navigate');

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
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
              getAuthProviders: jasmine
                .createSpy('getAuthProviders')
                .and.resolveTo({ providers: ['oauth'] }),
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
  });

  it('password login stores session and navigates', async () => {
    fixture.detectChanges();
    await fixture.componentInstance.onSubmit();
    expect(login).toHaveBeenCalledWith('admin', 'admin123');
    expect(navigate).toHaveBeenCalledWith(['/app']);
  });

  it('oauth login uses client credentials when enabled', async () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(EmcapApiService);
    fixture.detectChanges();
    await fixture.componentInstance.onOAuth();
    expect(api.client.loginOAuth).toHaveBeenCalledWith('emcap-client', 'emcap-secret');
    expect(auth.setSession).toHaveBeenCalledWith('oauth-token', 'default');
  });

  it('oauth shows error when provider disabled', async () => {
    const api = TestBed.inject(EmcapApiService);
    (api.client.getAuthProviders as jasmine.Spy).and.resolveTo({ providers: [] });
    fixture.detectChanges();
    await fixture.componentInstance.onOAuth();
    expect(fixture.componentInstance.error).toBe('OAuth disabled in config');
  });

  it('redirects when already authenticated and surfaces login errors', async () => {
    spyOn(TestBed.inject(AuthService), 'isAuthenticated').and.returnValue(true);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/app']);

    login.and.rejectWith(new Error('bad credentials'));
    const errorFixture = TestBed.createComponent(LoginComponent);
    errorFixture.detectChanges();
    await errorFixture.componentInstance.onSubmit();
    expect(errorFixture.componentInstance.error).toContain('bad credentials');

    (TestBed.inject(EmcapApiService).client.loginOAuth as jasmine.Spy).and.rejectWith('oauth down');
    await errorFixture.componentInstance.onOAuth();
    expect(errorFixture.componentInstance.error).toBe('OAuth failed');
  });
});
