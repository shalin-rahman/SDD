import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../utils/locale_format_util.dart';
import 'preferences_service.dart';

class I18nService {
  I18nService._();

  static final Map<String, Map<String, String>> _bundles = {};

  static Future<void> loadBundles() async {
    for (final tag in supportedLocaleTags) {
      final raw = await rootBundle.loadString('assets/i18n/$tag.json');
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      _bundles[tag] = decoded.map((key, value) => MapEntry(key, '$value'));
    }
    for (final entry in legacyLocaleAliases.entries) {
      final canonical = _bundles[entry.value];
      if (canonical != null) {
        _bundles[entry.key] = canonical;
      }
    }
  }

  static String t(String key, {Map<String, String>? params, String? localeTag}) {
    final tag = canonicalLocaleTag(localeTag ?? EmcapLocale.localeTag);
    final template = _bundles[tag]?[key] ?? _bundles['en-US']?[key] ?? key;
    if (params == null || params.isEmpty) {
      return template;
    }
    var result = template;
    for (final entry in params.entries) {
      result = result.replaceAll('{${entry.key}}', entry.value);
    }
    return result;
  }

  static String plural(
    String baseKey,
    num count, {
    Map<String, String>? params,
    String? localeTag,
  }) {
    final tag = canonicalLocaleTag(localeTag ?? EmcapLocale.localeTag);
    final category = resolvePluralCategory(count);
    final merged = <String, String>{...?params};
    merged.putIfAbsent('count', () => formatInteger(count, tag));
    return t('$baseKey.$category', params: merged, localeTag: tag);
  }

  static Map<String, String>? bundle(String localeTag) => _bundles[canonicalLocaleTag(localeTag)];
}

class EmcapLocale {
  EmcapLocale._();

  static PreferencesService? _prefs;
  static final locale = ValueNotifier<Locale>(const Locale('en', 'US'));

  static const supported = [
    Locale('en', 'US'),
    Locale('fr', 'FR'),
    Locale('bn', 'BD'),
  ];

  static String get localeTag {
    final value = locale.value;
    if (value.countryCode != null && value.countryCode!.isNotEmpty) {
      return '${value.languageCode}-${value.countryCode}';
    }
    return canonicalLocaleTag(value.languageCode);
  }

  static void init(PreferencesService prefs) {
    _prefs = prefs;
    locale.value = _localeFromStored(prefs.loadLocaleTag());
  }

  static bool _isSupported(Locale locale) {
    return supported.any(
      (entry) =>
          entry.languageCode == locale.languageCode &&
          entry.countryCode == locale.countryCode,
    );
  }

  static Locale _localeFromStored(String stored) {
    final canonical = canonicalLocaleTag(stored);
    final parts = canonical.split('-');
    if (parts.length >= 2) {
      final candidate = Locale.fromSubtags(languageCode: parts[0], countryCode: parts[1]);
      if (_isSupported(candidate)) {
        return candidate;
      }
      return supported.first;
    }
    for (final entry in supported) {
      if (entry.languageCode == parts[0]) {
        return Locale(entry.languageCode);
      }
    }
    return supported.first;
  }

  static Locale _supportedLocale(Locale value) {
    if (value.countryCode == null || value.countryCode!.isEmpty) {
      for (final entry in supported) {
        if (entry.languageCode == value.languageCode) {
          return Locale(value.languageCode);
        }
      }
      return supported.first;
    }
    return _localeFromStored('${value.languageCode}-${value.countryCode}');
  }

  static Future<void> setLocale(Locale value) async {
    final resolved = _supportedLocale(value);
    locale.value = resolved;
    await _prefs?.saveLocaleTag(localeTag);
  }

  static Future<void> setLocaleTag(String tag) async {
    await setLocale(_localeFromStored(tag));
  }

  static String t(String key, {Map<String, String>? params}) => I18nService.t(key, params: params);
}
