import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    sessionStorage.clear();
    navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Router, useValue: { navigate } }],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => sessionStorage.clear());

  it('stores and reads session token and tenant', () => {
    service.setSession('abc-token', 'tenant-a');
    expect(service.getToken()).toBe('abc-token');
    expect(service.getTenantId()).toBe('tenant-a');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('logout clears session and navigates home', () => {
    service.setSession('abc-token', 'default');
    service.logout();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
