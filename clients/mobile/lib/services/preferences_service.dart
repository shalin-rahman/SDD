import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Persists shell preferences using the same keys as the web client.
class PreferencesService {
  PreferencesService(this._prefs);

  static const themeKey = 'emcap-theme';
  static const localeKey = 'emcap-locale';

  final SharedPreferences _prefs;

  static Future<PreferencesService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return PreferencesService(prefs);
  }

  ThemeMode loadThemeMode() {
    final stored = _prefs.getString(themeKey);
    if (stored == 'dark') {
      return ThemeMode.dark;
    }
    if (stored == 'light') {
      return ThemeMode.light;
    }
    return ThemeMode.system;
  }

  Future<void> saveThemeMode(ThemeMode mode) async {
    switch (mode) {
      case ThemeMode.dark:
        await _prefs.setString(themeKey, 'dark');
      case ThemeMode.light:
        await _prefs.setString(themeKey, 'light');
      case ThemeMode.system:
        await _prefs.remove(themeKey);
    }
  }

  Locale loadLocale() {
    final stored = _prefs.getString(localeKey);
    if (stored == 'fr') {
      return const Locale('fr');
    }
    if (stored == 'bn') {
      return const Locale('bn');
    }
    return const Locale('en');
  }

  Future<void> saveLocale(Locale locale) async {
    await _prefs.setString(localeKey, locale.languageCode);
  }
}
