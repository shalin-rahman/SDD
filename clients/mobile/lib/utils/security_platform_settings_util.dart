/// Middleware defaults mirrored from `platform/api/src/emcap/auth/middleware.py`.
const securityRateLimitPerMinute = 120;

class SecurityPlatformSettings {
  const SecurityPlatformSettings({
    required this.rateLimitPerMinute,
    required this.securityHeadersEnabled,
    required this.mfaEnrollment,
    required this.abacPolicyCount,
  });

  final int rateLimitPerMinute;
  final bool securityHeadersEnabled;
  final String mfaEnrollment;
  final int abacPolicyCount;
}

/// Read-only security posture from GET /config/platform payload.
SecurityPlatformSettings parseSecurityPlatformSettings(Map<String, dynamic> config) {
  final security = config['security'];
  final policies = security is Map ? security['abac_policies'] : null;
  return SecurityPlatformSettings(
    rateLimitPerMinute: securityRateLimitPerMinute,
    securityHeadersEnabled: true,
    mfaEnrollment: 'account',
    abacPolicyCount: policies is List ? policies.length : 0,
  );
}
