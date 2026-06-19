import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/services/preferences_service.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await I18nService.loadBundles();
  });

  test('t resolves known key from default locale', () {
    final value = I18nService.t('platform.login.title');
    expect(value, isNotEmpty);
    expect(value, isNot('platform.login.title'));
  });

  test('t substitutes params in template', () {
    final value = I18nService.t(
      'plural.recordCount.one',
      params: {'count': '5'},
      localeTag: 'en-US',
    );
    expect(value, contains('5'));
  });

  test('t falls back to key when missing', () {
    expect(I18nService.t('nonexistent.key.xyz'), 'nonexistent.key.xyz');
  });

  test('plural selects category and injects count', () {
    final one = I18nService.plural('plural.recordCount', 1, localeTag: 'en-US');
    final many = I18nService.plural('plural.recordCount', 5, localeTag: 'en-US');
    expect(one, contains('1'));
    expect(many, contains('5'));
    expect(one, isNot(equals(many)));
  });

  test('bundle returns map for supported locale', () {
    expect(I18nService.bundle('en-US'), isNotNull);
    expect(I18nService.bundle('fr-FR'), isNotNull);
  });

  test('EmcapLocale init and setLocale persist preference', () async {
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
    await EmcapLocale.setLocale(const Locale('fr', 'FR'));
    expect(EmcapLocale.localeTag, 'fr-FR');
    expect(EmcapLocale.t('platform.login.title'), isNotEmpty);

    await EmcapLocale.setLocaleTag('bn-BD');
    expect(EmcapLocale.localeTag, 'bn-BD');

    await EmcapLocale.setLocale(const Locale('en'));
    expect(EmcapLocale.localeTag, startsWith('en'));
  });
}
