/** Middleware defaults mirrored from `platform/api/src/emcap/auth/middleware.py`. */
export const SECURITY_RATE_LIMIT_PER_MINUTE = 120;

export interface SecurityPlatformSettings {
  rateLimitPerMinute: number;
  securityHeadersEnabled: boolean;
  mfaEnrollment: 'account';
  abacPolicyCount: number;
}

/** Read-only security posture from GET /config/platform payload. */
export function parseSecurityPlatformSettings(
  config: Record<string, unknown>,
): SecurityPlatformSettings {
  const security = config['security'] as Record<string, unknown> | undefined;
  const policies = security?.['abac_policies'];
  return {
    rateLimitPerMinute: SECURITY_RATE_LIMIT_PER_MINUTE,
    securityHeadersEnabled: true,
    mfaEnrollment: 'account',
    abacPolicyCount: Array.isArray(policies) ? policies.length : 0,
  };
}
