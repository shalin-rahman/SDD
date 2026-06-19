import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:emcap_mobile/services/i18n_service.dart';

/// Shared bootstrap for entity screen widget tests (Batch 2 / M2 partials).
Future<void> initMobileScreenTests() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  await initIntlDateFormatting();
  await I18nService.loadBundles();
}

/// intl [DateFormat] requires locale symbol data in tests.
Future<void> initIntlDateFormatting() async {
  for (final locale in ['en_US', 'bn_BD', 'fr_FR', 'en']) {
    await initializeDateFormatting(locale);
  }
}

/// Allow async form + record loads without [WidgetTester.pumpAndSettle] — the
/// initial [CircularProgressIndicator] animates forever and causes early settle.
Future<void> settleEntityScreen(WidgetTester tester) async {
  await tester.pump();
  for (var i = 0; i < 120; i++) {
    await tester.pump(const Duration(milliseconds: 50));
    if (find.byType(CircularProgressIndicator).evaluate().isEmpty &&
        find.byType(LinearProgressIndicator).evaluate().isEmpty) {
      await tester.pump(const Duration(milliseconds: 100));
      if (find.byType(CircularProgressIndicator).evaluate().isEmpty &&
          find.byType(LinearProgressIndicator).evaluate().isEmpty) {
        break;
      }
    }
  }
  await tester.pump(const Duration(milliseconds: 100));
}

/// Settings admin reload — avoid [pumpAndSettle] on infinite progress animation.
Future<void> settleSettingsScreen(WidgetTester tester) async {
  await tester.pump();
  for (var i = 0; i < 120; i++) {
    await tester.pump(const Duration(milliseconds: 50));
    if (find.byType(CircularProgressIndicator).evaluate().isEmpty) {
      break;
    }
  }
  await tester.pump(const Duration(milliseconds: 100));
}

/// Pump until [finder] matches or [maxPumps] exhausted.
Future<void> pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 120,
  Duration step = const Duration(milliseconds: 50),
}) async {
  for (var i = 0; i < maxPumps; i++) {
    if (finder.evaluate().isNotEmpty) {
      return;
    }
    await tester.pump(step);
  }
}
