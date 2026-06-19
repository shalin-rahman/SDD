import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/services/preferences_service.dart';
import 'package:emcap_mobile/utils/locale_format_util.dart';

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

  test('t resolves legacy locale alias bundles', () {
    final en = I18nService.t('platform.login.title', localeTag: 'en');
    final enUs = I18nService.t('platform.login.title', localeTag: 'en-US');
    expect(en, enUs);
  });

  test('bundle returns map for legacy alias tag', () {
    expect(I18nService.bundle('en'), isNotNull);
    expect(I18nService.bundle('en'), I18nService.bundle('en-US'));
  });

  test('plural formats count for bn-BD locale', () {
    final value = I18nService.plural('plural.recordCount', 3, localeTag: 'bn-BD');
    expect(value, isNotEmpty);
    expect(value, isNot('plural.recordCount.other'));
  });

  test('EmcapLocale resolves supported language-only locale', () async {
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
    await EmcapLocale.setLocale(const Locale('fr'));
    expect(EmcapLocale.localeTag, 'fr-FR');
  });

  test('EmcapLocale localeTag uses language code when country absent', () async {
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
    await EmcapLocale.setLocale(const Locale('bn'));
    expect(EmcapLocale.localeTag, 'bn-BD');
  });

  test('EmcapLocale falls back to first supported locale for unknown tag', () async {
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
    await EmcapLocale.setLocaleTag('xx-YY');
    expect(EmcapLocale.locale.value.languageCode, 'en');
  });

  test('I18nService bundle returns null for unknown locale', () {
    expect(I18nService.bundle('xx-YY'), isNull);
  });

  test('EmcapLocale localeTag uses language-only canonical tag', () async {
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
    await EmcapLocale.setLocale(const Locale('en'));
    expect(EmcapLocale.localeTag, 'en-US');
    expect(EmcapLocale.locale.value.countryCode, isNull);
    expect(EmcapLocale.localeTag, canonicalLocaleTag('en'));
  });

  test('EmcapLocale resolves unknown language to first supported locale', () async {
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
    await EmcapLocale.setLocaleTag('zz-ZZ');
    expect(EmcapLocale.locale.value.languageCode, 'en');
    expect(EmcapLocale.locale.value.countryCode, 'US');
  });

  test('I18nService plural without explicit params still formats count', () {
    final value = I18nService.plural('plural.recordCount', 2, localeTag: 'en-US');
    expect(value, contains('2'));
  });
}
