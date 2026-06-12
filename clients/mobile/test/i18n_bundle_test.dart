import 'dart:convert';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMessageHandler('flutter/assets', (message) async {
      final key = utf8.decode(message!.buffer.asUint8List());
      if (key.endsWith('en.json')) {
        return utf8.encode('{"nav.signOut":"Sign out","settings.title":"Settings"}');
      }
      if (key.endsWith('fr.json')) {
        return utf8.encode('{"nav.signOut":"Déconnexion","settings.title":"Paramètres"}');
      }
      if (key.endsWith('bn.json')) {
        return utf8.encode('{"nav.signOut":"সাইন আউট","settings.title":"সেটিংস"}');
      }
      return null;
    });
    await I18nService.loadBundles();
  });

  test('loads bundles and translates by locale', () {
    expect(I18nService.t('nav.signOut', localeCode: 'en'), 'Sign out');
    expect(I18nService.t('nav.signOut', localeCode: 'fr'), 'Déconnexion');
    expect(I18nService.t('nav.signOut', localeCode: 'bn'), 'সাইন আউট');
  });

  test('falls back to English for missing keys', () {
    expect(I18nService.t('settings.title', localeCode: 'bn'), 'সেটিংস');
    expect(I18nService.t('missing.key', localeCode: 'bn'), 'missing.key');
  });
}
