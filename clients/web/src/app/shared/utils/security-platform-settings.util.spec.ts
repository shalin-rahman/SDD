import {
  parseSecurityPlatformSettings,
  SECURITY_RATE_LIMIT_PER_MINUTE,
} from './security-platform-settings.util';

describe('parseSecurityPlatformSettings', () => {
  it('parses ABAC policy count and applies middleware defaults', () => {
    const result = parseSecurityPlatformSettings({
      security: {
        abac_policies: [{ permission: 'customer.read' }, { permission: 'customer.write' }],
      },
    });

    expect(result).toEqual({
      rateLimitPerMinute: SECURITY_RATE_LIMIT_PER_MINUTE,
      securityHeadersEnabled: true,
      mfaEnrollment: 'account',
      abacPolicyCount: 2,
    });
  });

  it('defaults ABAC count to zero when security section is absent', () => {
    expect(parseSecurityPlatformSettings({}).abacPolicyCount).toBe(0);
  });
});
