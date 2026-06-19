import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/services/i18n_service.dart';

/// P18-T12 — high-impact admin/settings keys present in all locales.
void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await I18nService.loadBundles();
  });

  const keys = [
    'admin.users.inactive',
    'admin.users.editTitle',
    'admin.users.createTitle',
    'admin.users.deactivate',
    'admin.users.accountActive',
    'admin.roles.save',
    'admin.roles.permissionsTitle',
    'admin.permissions.catalog',
    'admin.permissions.permissionCountSuffix',
    'admin.permissions.wildcardAll',
    'settings.templates.sectionTitle',
    'settings.audit.sectionTitle',
    'shell.nav.unknown',
    'common.back',
    'toolbar.language.en-US',
  ];

  for (final locale in ['en-US', 'fr-FR', 'bn-BD']) {
    test('admin i18n keys resolve for $locale', () {
      for (final key in keys) {
        final value = I18nService.t(key, localeTag: locale);
        expect(value, isNot(equals(key)), reason: '$locale missing $key');
      }
    });
  }
}
