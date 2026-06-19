import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/utils/shell_nav_util.dart';

void main() {
  setUp(() {
    EmcapLocale.setLocaleTag('en-US');
  });

  test('P13-T12 field access editor i18n keys resolve', () {
    expect(EmcapLocale.t('admin.security.editField'), isNotEmpty);
    expect(EmcapLocale.t('admin.security.saveFieldAccess'), isNotEmpty);
    expect(EmcapLocale.t('admin.security.fieldAccessSaved'), isNotEmpty);
    expect(EmcapLocale.t('admin.security.fieldAccessSaveFailed'), isNotEmpty);
  });

  test('admin.security.write permission gate for field edit', () {
    expect(hasPermission(['admin.security.write'], 'admin.security.write'), isTrue);
    expect(hasPermission(['admin.security.read'], 'admin.security.write'), isFalse);
    expect(hasPermission(['admin.*'], 'admin.security.write'), isTrue);
  });
}
