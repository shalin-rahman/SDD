import { TestBed } from '@angular/core/testing';

import { createClient } from '../api/emcap-client';
import { AuthService } from './auth.service';
import { EmcapApiService } from './emcap-api.service';

describe('EmcapApiService', () => {
  it('injects token from AuthService into client', () => {
    TestBed.configureTestingModule({
      providers: [
        EmcapApiService,
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'session-token',
            getTenantId: () => 'tenant-x',
            handleUnauthorized: jasmine.createSpy('handleUnauthorized'),
          },
        },
      ],
    });
    const service = TestBed.inject(EmcapApiService);
    const client = service.client;
    expect(client.getTenantId()).toBe('tenant-x');
  });

  it('wires client unauthorized handler to AuthService', () => {
    const handleUnauthorized = jasmine.createSpy('handleUnauthorized');
    TestBed.configureTestingModule({
      providers: [
        EmcapApiService,
        {
          provide: AuthService,
          useValue: {
            getToken: () => null,
            getTenantId: () => 'default',
            handleUnauthorized,
          },
        },
      ],
    });
    const service = TestBed.inject(EmcapApiService);
    service.client.setToken('tok', 'default');
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });
});

describe('EmcapClient HTTP', () => {
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch');
  });

  it('login posts credentials and returns token payload', async () => {
    fetchSpy.and.resolveTo(
      new Response(
        JSON.stringify({ access_token: 'tok', user_id: 'u1', tenant_id: 'default' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = createClient('http://localhost:8000');
    const result = await client.login('admin', 'admin123');
    expect(result.access_token).toBe('tok');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('request throws on non-ok response', async () => {
    fetchSpy.and.resolveTo(new Response('bad request', { status: 400 }));
    const client = createClient('http://localhost:8000');
    await expectAsync(client.getHealth()).toBeRejectedWithError(/400/);
  });

  it('request returns undefined for 204', async () => {
    fetchSpy.and.resolveTo(new Response(null, { status: 204 }));
    const client = createClient('http://localhost:8000');
    client.setToken('tok', 'default');
    await expectAsync(client.deleteAdminTemplate('tpl-1')).toBeResolvedTo(undefined);
  });

  it('sends Authorization and tenant headers when token set', async () => {
    fetchSpy.and.resolveTo(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = createClient('http://localhost:8000');
    client.setToken('abc', 'tenant-a');
    await client.getHealth();
    const init = fetchSpy.calls.mostRecent().args[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer abc');
    expect(headers['X-Tenant-ID']).toBe('tenant-a');
  });
});
