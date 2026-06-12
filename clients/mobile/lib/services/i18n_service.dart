import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'preferences_service.dart';

class I18nService {
  I18nService._();

  static final Map<String, Map<String, String>> _bundles = {};

  static Future<void> loadBundles() async {
    for (final code in ['en', 'fr', 'bn']) {
      final raw = await rootBundle.loadString('assets/i18n/$code.json');
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      _bundles[code] = decoded.map((key, value) => MapEntry(key, '$value'));
    }
  }

  static String t(String key, {String? localeCode}) {
    final code = localeCode ?? EmcapLocale.locale.value.languageCode;
    return _bundles[code]?[key] ?? _bundles['en']?[key] ?? key;
  }

  static Map<String, String>? bundle(String localeCode) => _bundles[localeCode];
}

class EmcapLocale {
  static PreferencesService? _prefs;
  static final locale = ValueNotifier<Locale>(const Locale('en'));
  static const supported = [Locale('en'), Locale('fr'), Locale('bn')];

  static void init(PreferencesService prefs) {
    _prefs = prefs;
    locale.value = _supportedLocale(prefs.loadLocale().languageCode);
  }

  static Locale _supportedLocale(String code) {
    for (final entry in supported) {
      if (entry.languageCode == code) {
        return entry;
      }
    }
    return const Locale('en');
  }

  static Future<void> setLocale(Locale value) async {
    final resolved = _supportedLocale(value.languageCode);
    locale.value = resolved;
    await _prefs?.saveLocale(resolved);
  }

  static String t(String key) => I18nService.t(key);
}
