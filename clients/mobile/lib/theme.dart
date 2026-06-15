import 'package:flutter/material.dart';

import 'services/preferences_service.dart';
import 'theme/app_tokens.dart';

class EmcapTheme {
  static PreferencesService? _prefs;
  static final seedColor = ValueNotifier<Color>(Colors.indigo);
  static final themeMode = ValueNotifier<ThemeMode>(ThemeMode.system);
  static final compactDensity = ValueNotifier<bool>(false);

  static void init(PreferencesService prefs) {
    _prefs = prefs;
    themeMode.value = prefs.loadThemeMode();
    compactDensity.value = prefs.loadCompactDensity();
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

  static Future<void> toggleCompactDensity() async {
    final next = !compactDensity.value;
    compactDensity.value = next;
    await _prefs?.saveCompactDensity(next);
  }

  static ThemeData buildThemeData({
    required Color seed,
    required Brightness brightness,
    bool compact = false,
  }) {
    final tokens = EmcapThemeTokens.forBrightness(brightness, compact: compact);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: seed,
      brightness: brightness,
      surface: tokens.surface,
      onSurface: tokens.text,
      outline: tokens.border,
      error: tokens.error,
    );
    return ThemeData(
      colorScheme: colorScheme,
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: tokens.surface,
      extensions: [tokens],
      cardTheme: CardTheme(
        color: tokens.panelSurface,
        elevation: tokens.elevation1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(tokens.radiusCard),
          side: BorderSide(color: tokens.border),
        ),
      ),
      textTheme: TextTheme(
        titleLarge: TextStyle(fontSize: tokens.fontTitleLg, color: tokens.text),
        titleMedium: TextStyle(fontSize: tokens.fontTitleMd, color: tokens.text),
        bodyMedium: TextStyle(fontSize: tokens.fontBodyMd, color: tokens.text),
        bodySmall: TextStyle(fontSize: tokens.fontBodySm, color: tokens.textMuted),
        labelSmall: TextStyle(fontSize: tokens.fontLabelSm, color: tokens.textMuted),
      ),
    );
  }
}

// EmcapLocale lives in services/i18n_service.dart
