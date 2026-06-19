import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:emcap_mobile/services/preferences_service.dart';
import 'package:emcap_mobile/theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('EmcapTheme init loads persisted theme mode and density', () async {
    SharedPreferences.setMockInitialValues({
      PreferencesService.themeKey: 'dark',
      PreferencesService.densityKey: 'compact',
    });
    final prefs = await PreferencesService.create();
    EmcapTheme.init(prefs);
    expect(EmcapTheme.themeMode.value, ThemeMode.dark);
    expect(EmcapTheme.compactDensity.value, isTrue);
  });

  test('EmcapTheme toggles theme mode and compact density', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await PreferencesService.create();
    EmcapTheme.init(prefs);

    await EmcapTheme.setThemeMode(ThemeMode.light);
    expect(EmcapTheme.themeMode.value, ThemeMode.light);
    expect(prefs.loadThemeMode(), ThemeMode.light);

    await EmcapTheme.toggleThemeMode();
    expect(EmcapTheme.themeMode.value, ThemeMode.dark);

    await EmcapTheme.toggleCompactDensity();
    expect(EmcapTheme.compactDensity.value, isTrue);
    expect(prefs.loadCompactDensity(), isTrue);

    await EmcapTheme.toggleCompactDensity();
    expect(EmcapTheme.compactDensity.value, isFalse);
  });

  test('buildThemeData supports compact density flag', () {
    final theme = EmcapTheme.buildThemeData(
      seed: Colors.teal,
      brightness: Brightness.dark,
      compact: true,
    );
    expect(theme.brightness, Brightness.dark);
    expect(theme.useMaterial3, isTrue);
  });
}
