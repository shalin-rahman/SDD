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

/// Pump until loading screen-reader semantics appear (bounded — not full settle).
Future<void> settleLoadingSemantics(WidgetTester tester) async {
  await pumpUntilFound(
    tester,
    find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading')),
    maxPumps: 10,
  );
}

/// Allow async form + record loads without [WidgetTester.pumpAndSettle] — the
/// initial [CircularProgressIndicator] animates forever and causes early settle.
///
/// Metadata and record loads run in parallel; each phase may show loading
/// semantics or a full-screen spinner before [a11y.landmark.main] appears.
Future<void> settleEntityScreen(WidgetTester tester) async {
  final loadingSemantics = find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading'));
  final mainLandmark = find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main'));
  const step = Duration(milliseconds: 50);

  await tester.pump();
  for (var i = 0; i < 120; i++) {
    await tester.pump(step);
    final mainReady = mainLandmark.evaluate().isNotEmpty &&
        loadingSemantics.evaluate().isEmpty &&
        find.byType(CircularProgressIndicator).evaluate().isEmpty;
    if (mainReady) {
      break;
    }
  }
  await pumpUntilAbsent(tester, find.byType(LinearProgressIndicator), maxPumps: 40, step: step);
  await tester.pump(const Duration(milliseconds: 100));
}

/// Settings admin reload — avoid [pumpAndSettle] on infinite progress animation.
Future<void> settleSettingsScreen(WidgetTester tester) async {
  await pumpUntilFound(tester, find.text(EmcapLocale.t('settings.title')));
}

/// Pump until [finder] matches or [maxPumps] exhausted.
Future<void> pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 120,
  Duration step = const Duration(milliseconds: 50),
}) async {
  await tester.pump();
  for (var i = 0; i < maxPumps; i++) {
    if (finder.evaluate().isNotEmpty) {
      return;
    }
    await tester.pump(step);
  }
}

/// Account screen async bootstrap — avoid [pumpAndSettle] on loading text.
Future<void> settleAccountScreen(WidgetTester tester) async {
  await pumpUntilFound(
    tester,
    find.text(EmcapLocale.t('platform.account.enrollMfa')),
  );
  await tester.pump(const Duration(milliseconds: 100));
}

/// Scroll account [ListView] until [target] is visible.
Future<void> scrollAccountTo(WidgetTester tester, Finder target) async {
  if (target.evaluate().isEmpty) {
    final listView = find.byType(ListView);
    if (listView.evaluate().isNotEmpty) {
      for (var i = 0; i < 20 && target.evaluate().isEmpty; i++) {
        await tester.drag(listView, const Offset(0, -400));
        await tester.pump();
      }
    }
  }
  if (target.evaluate().isNotEmpty) {
    await tester.ensureVisible(target.first);
    await tester.pump(const Duration(milliseconds: 50));
  }
}

/// Entity record detail tabs (notes/documents) — after main landmark, wait for detail load.
Future<void> settleEntityRecordDetail(WidgetTester tester) async {
  await settleEntityScreen(tester);
  await pumpUntilAbsent(tester, find.byType(LinearProgressIndicator), maxPumps: 120);
  await tester.pump(const Duration(milliseconds: 100));
}

/// Admin / platform screens — wait for main landmark or legacy spinner clear.
Future<void> settleAdminScreen(WidgetTester tester) async {
  final mainLandmark = find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.main'));
  final loadingSemantics = find.bySemanticsLabel(EmcapLocale.t('a11y.screenReader.loading'));
  const step = Duration(milliseconds: 50);

  await tester.pump();
  for (var i = 0; i < 120; i++) {
    await tester.pump(step);
    if (mainLandmark.evaluate().isNotEmpty && loadingSemantics.evaluate().isEmpty) {
      await tester.pump(const Duration(milliseconds: 100));
      return;
    }
    if (find.byType(CircularProgressIndicator).evaluate().isEmpty &&
        mainLandmark.evaluate().isEmpty &&
        loadingSemantics.evaluate().isEmpty) {
      await tester.pump(const Duration(milliseconds: 100));
      return;
    }
  }
}

/// Workflow inbox — no main landmark; wait for instance list.
Future<void> settleWorkflowInbox(WidgetTester tester) async {
  await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));
  await pumpUntilFound(tester, find.text('approval'));
  await tester.pump(const Duration(milliseconds: 100));
}

/// Pump until [finder] matches nothing or [maxPumps] exhausted.
Future<void> pumpUntilAbsent(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 120,
  Duration step = const Duration(milliseconds: 50),
}) async {
  await tester.pump();
  for (var i = 0; i < maxPumps; i++) {
    if (finder.evaluate().isEmpty) {
      await tester.pump(const Duration(milliseconds: 100));
      return;
    }
    await tester.pump(step);
  }
}
