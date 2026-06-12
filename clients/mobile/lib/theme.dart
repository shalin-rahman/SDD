import 'package:flutter/material.dart';

import 'services/preferences_service.dart';

class EmcapTheme {
  static PreferencesService? _prefs;
  static final seedColor = ValueNotifier<Color>(Colors.indigo);
  static final themeMode = ValueNotifier<ThemeMode>(ThemeMode.system);

  static void init(PreferencesService prefs) {
    _prefs = prefs;
    themeMode.value = prefs.loadThemeMode();
  }

  static Future<void> setThemeMode(ThemeMode mode) async {
    themeMode.value = mode;
    await _prefs?.saveThemeMode(mode);
  }

  static Future<void> toggleThemeMode() async {
    final current = themeMode.value;
    final resolved = current == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    await setThemeMode(resolved);
  }
}

// EmcapLocale lives in services/i18n_service.dart
