import 'package:emcap_mobile/services/preferences_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('loadThemeMode defaults to system when unset', () async {
    SharedPreferences.setMockInitialValues({});
    final service = await PreferencesService.create();
    expect(service.loadThemeMode(), ThemeMode.system);
  });

  test('persists theme mode with emcap-theme key', () async {
    SharedPreferences.setMockInitialValues({});
    final service = await PreferencesService.create();
    await service.saveThemeMode(ThemeMode.dark);
    expect(service.loadThemeMode(), ThemeMode.dark);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString(PreferencesService.themeKey), 'dark');
  });

  test('persists locale with emcap-locale key', () async {
    SharedPreferences.setMockInitialValues({});
    final service = await PreferencesService.create();
    await service.saveLocale(const Locale('fr'));
    expect(service.loadLocale(), const Locale('fr'));
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString(PreferencesService.localeKey), 'fr');
  });

  test('clearing theme restores system default', () async {
    SharedPreferences.setMockInitialValues({PreferencesService.themeKey: 'dark'});
    final service = await PreferencesService.create();
    expect(service.loadThemeMode(), ThemeMode.dark);
    await service.saveThemeMode(ThemeMode.system);
    expect(service.loadThemeMode(), ThemeMode.system);
  });
}
