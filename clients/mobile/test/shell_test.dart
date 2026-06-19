import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:emcap_mobile/app/shell.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/services/preferences_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/fake_emcap_client.dart';
import 'support/screen_test_harness.dart';

Future<void> _pumpShell(WidgetTester tester, {Size size = const Size(1200, 800)}) async {
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    MaterialApp(
      theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
      home: EmcapShell(client: FakeEmcapClient()),
    ),
  );
  await settleEntityScreen(tester);
}

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
    final prefs = await PreferencesService.create();
    EmcapLocale.init(prefs);
  });

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    EmcapTheme.themeMode.value = ThemeMode.system;
    EmcapTheme.compactDensity.value = false;
    await EmcapLocale.setLocaleTag('en-US');
  });

  testWidgets('EmcapShell loads nav and shows workflow inbox by default', (tester) async {
    await _pumpShell(tester);
    expect(find.byType(CircularProgressIndicator), findsNothing);
    expect(find.text(EmcapLocale.t('platform.workflow.title')), findsOneWidget);
  });

  testWidgets('EmcapShell navigates to entity list via rail', (tester) async {
    await _pumpShell(tester);
    await tester.tap(find.byTooltip('Products'));
    await settleEntityScreen(tester);
    expect(find.text('Sample'), findsOneWidget);
  });

  testWidgets('EmcapShell navigates to settings reports dashboards notifications account', (tester) async {
    await _pumpShell(tester);

    for (final tooltip in [
      'Reports',
      'Dashboards',
      'Notifications',
      'Account',
      'Assistant',
      'Admin users',
      'Admin roles',
      'Permissions',
      'Security policies',
      'Settings',
    ]) {
      await tester.tap(find.byTooltip(tooltip));
      await settleEntityScreen(tester);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    }
  });

  testWidgets('EmcapShell navigates to admin screens', (tester) async {
    await _pumpShell(tester);
    // Covered in combined navigation test above.
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('EmcapShell toggles theme locale and density from app bar', (tester) async {
    await _pumpShell(tester);

    await tester.tap(find.byTooltip(EmcapLocale.t('toolbar.theme')));
    await tester.pumpAndSettle();
    expect(EmcapTheme.themeMode.value, ThemeMode.dark);

    await tester.tap(find.byTooltip(EmcapLocale.t('platform.account.densityCompact')));
    await tester.pumpAndSettle();
    expect(EmcapTheme.compactDensity.value, isTrue);

    await tester.tap(find.byTooltip(EmcapLocale.t('toolbar.locale')));
    await tester.pumpAndSettle();
    await tester.tap(find.text(EmcapLocale.t('toolbar.language.fr-FR')));
    await tester.pumpAndSettle();
    expect(EmcapLocale.localeTag, 'fr-FR');
  });

  testWidgets('EmcapShell drawer navigation on narrow layout', (tester) async {
    await _pumpShell(tester, size: const Size(600, 800));
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Products'));
    await settleEntityScreen(tester);
    expect(find.text('Sample'), findsOneWidget);
  });

  testWidgets('EmcapShell tenant dropdown updates client tenant', (tester) async {
    final client = FakeEmcapClient();
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: EmcapShell(client: client),
      ),
    );
    await settleEntityScreen(tester);
    await tester.tap(find.byType(DropdownButton<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Default').last);
    await tester.pumpAndSettle();
    expect(client.getTenantId(), 'default');
  });
}
