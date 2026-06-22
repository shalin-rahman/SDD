import 'package:flutter/material.dart';

import 'package:shared_preferences/shared_preferences.dart';



import '../utils/locale_format_util.dart';



/// Persists shell preferences using the same keys as the web client.

class PreferencesService {

  PreferencesService(this._prefs);



  static const themeKey = 'emcap-theme';

  static const localeKey = 'emcap-locale';

  static const densityKey = 'emcap-density';



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



  String loadLocaleTag() {

    final stored = _prefs.getString(localeKey);

    if (stored == null || stored.isEmpty) {

      return 'en-US';

    }

    return canonicalLocaleTag(stored);

  }



  Locale loadLocale() {

    final tag = loadLocaleTag();

    final parts = tag.split('-');

    if (parts.length >= 2) {

      return Locale.fromSubtags(languageCode: parts[0], countryCode: parts[1]);

    }

    return Locale(parts[0]);

  }



  Future<void> saveLocale(Locale locale) async {

    final tag = locale.countryCode != null && locale.countryCode!.isNotEmpty

        ? '${locale.languageCode}-${locale.countryCode}'

        : canonicalLocaleTag(locale.languageCode);

    await saveLocaleTag(tag);

  }



  Future<void> saveLocaleTag(String tag) async {

    await _prefs.setString(localeKey, canonicalLocaleTag(tag));

  }



  bool loadCompactDensity() => _prefs.getString(densityKey) == 'compact';



  Future<void> saveCompactDensity(bool compact) async {

    if (compact) {

      await _prefs.setString(densityKey, 'compact');

    } else {

      await _prefs.remove(densityKey);

    }

  }

}

