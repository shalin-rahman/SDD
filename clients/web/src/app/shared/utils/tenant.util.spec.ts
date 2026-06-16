import {
  extractModuleToggles,
  extractUserPermissions,
  tenantId,
  tenantLabel,
} from './tenant.util';

describe('tenant.util', () => {
  it('tenantId prefers id then code', () => {
    expect(tenantId({ id: 't1', code: 'acme' })).toBe('t1');
    expect(tenantId({ code: 'acme' })).toBe('acme');
    expect(tenantId({})).toBe('default');
  });

  it('tenantLabel prefers name then code', () => {
    expect(tenantLabel({ name: 'Acme', code: 'acme' })).toBe('Acme');
    expect(tenantLabel({ code: 'acme' })).toBe('acme');
  });

  it('extractUserPermissions maps array or defaults wildcard', () => {
    expect(extractUserPermissions({ permissions: ['a.read'] })).toEqual(['a.read']);
    expect(extractUserPermissions({})).toEqual(['*.*']);
  });

  it('extractModuleToggles reads modules map', () => {
    expect(extractModuleToggles({ modules: { ai: { enabled: true } } })).toEqual({
      ai: { enabled: true },
    });
    expect(extractModuleToggles({})).toBeUndefined();
  });
});
