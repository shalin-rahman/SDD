import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/security_platform_settings_util.dart';

void main() {
  test('parseSecurityPlatformSettings reads ABAC policy count', () {
    final settings = parseSecurityPlatformSettings({
      'security': {
        'abac_policies': [
          {'permission': 'customer.read'},
        ],
      },
    });

    expect(settings.rateLimitPerMinute, 120);
    expect(settings.securityHeadersEnabled, isTrue);
    expect(settings.mfaEnrollment, 'account');
    expect(settings.abacPolicyCount, 1);
  });

  test('parseSecurityPlatformSettings defaults when security section missing', () {
    expect(parseSecurityPlatformSettings({}).abacPolicyCount, 0);
  });
}
