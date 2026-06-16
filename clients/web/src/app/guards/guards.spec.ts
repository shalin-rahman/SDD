import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { adminGuard, settingsGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { EmcapApiService } from '../services/emcap-api.service';
import { AuthService } from '../services/auth.service';

describe('route guards', () => {
  describe('authGuard', () => {
    it('allows authenticated users', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: { isAuthenticated: () => true } },
          { provide: Router, useValue: { createUrlTree: jasmine.createSpy() } },
        ],
      });
      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
      expect(result).toBeTrue();
    });

    it('redirects anonymous users to login', () => {
      const tree = {} as UrlTree;
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: { isAuthenticated: () => false } },
          { provide: Router, useValue: { createUrlTree: () => tree } },
        ],
      });
      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
      expect(result).toBe(tree);
    });
  });

  describe('adminGuard', () => {
    it('allows admin permissions', async () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine.createSpy('getMe').and.resolveTo({ permissions: ['admin.users.read'] }),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: jasmine.createSpy() } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() =>
        adminGuard({} as never, {} as never),
      );
      expect(result).toBeTrue();
    });

    it('redirects when admin permission missing', async () => {
      const tree = {} as UrlTree;
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine.createSpy('getMe').and.resolveTo({ permissions: ['customer.read'] }),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: () => tree } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() =>
        adminGuard({} as never, {} as never),
      );
      expect(result).toBe(tree);
    });
  });

  describe('settingsGuard', () => {
    it('allows admin.settings.read', async () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine
                  .createSpy('getMe')
                  .and.resolveTo({ permissions: ['admin.settings.read'] }),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: jasmine.createSpy() } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() =>
        settingsGuard({} as never, {} as never),
      );
      expect(result).toBeTrue();
    });

    it('redirects when settings permission missing or getMe fails', async () => {
      const tree = {} as UrlTree;
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine.createSpy('getMe').and.resolveTo({ permissions: ['customer.read'] }),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: () => tree } },
        ],
      });
      const denied = await TestBed.runInInjectionContext(() =>
        settingsGuard({} as never, {} as never),
      );
      expect(denied).toBe(tree);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine.createSpy('getMe').and.rejectWith(new Error('down')),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: () => tree } },
        ],
      });
      const failed = await TestBed.runInInjectionContext(() =>
        settingsGuard({} as never, {} as never),
      );
      expect(failed).toBe(tree);
    });
  });

  describe('adminGuard extra permissions', () => {
    it('allows admin.roles.read and handles getMe failure', async () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine.createSpy('getMe').and.resolveTo({ permissions: ['admin.roles.read'] }),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: jasmine.createSpy() } },
        ],
      });
      const allowed = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
      expect(allowed).toBeTrue();

      const tree = {} as UrlTree;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: EmcapApiService,
            useValue: {
              client: {
                getMe: jasmine.createSpy('getMe').and.rejectWith(new Error('down')),
              },
            },
          },
          { provide: Router, useValue: { createUrlTree: () => tree } },
        ],
      });
      const failed = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
      expect(failed).toBe(tree);
    });
  });
});
