import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:emcap_mobile/main.dart' as app;
import 'package:emcap_mobile/services/i18n_service.dart';

const mobileSignoffOutDir = '../../docs/product/screenshots';

Future<void> pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 160,
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

Future<void> pumpUntilAbsent(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 160,
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

Future<void> pumpAfterAction(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
}

Future<void> signInMobile(WidgetTester tester) async {
  app.main();
  await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator));
  final signIn = find.byType(ElevatedButton);
  await pumpUntilFound(tester, signIn);
  await tester.tap(signIn.first);
  await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator), maxPumps: 200);
  await pumpUntilFound(
    tester,
    find.bySemanticsLabel(EmcapLocale.t('a11y.landmark.navigation')),
    maxPumps: 200,
  );
}

Future<void> openDrawer(WidgetTester tester) async {
  final menu = find.byIcon(Icons.menu);
  if (menu.evaluate().isNotEmpty) {
    await tester.tap(menu.first);
    await pumpAfterAction(tester);
  }
}

Future<void> tapNavLabel(WidgetTester tester, Pattern label) async {
  final entry = find.textContaining(label);
  expect(entry, findsWidgets, reason: 'Nav item matching $label not found');
  await tester.tap(entry.first);
  await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator), maxPumps: 200);
  await pumpAfterAction(tester);
}

Future<void> openEntityMenu(WidgetTester tester, Pattern menuLabel) async {
  await openDrawer(tester);
  await tapNavLabel(tester, menuLabel);
}

Future<void> openFirstRecord(WidgetTester tester) async {
  final dataRows = find.byType(DataRow);
  await pumpUntilFound(tester, dataRows, maxPumps: 200);
  await tester.tap(dataRows.first);
  await pumpUntilAbsent(tester, find.byType(CircularProgressIndicator), maxPumps: 200);
  await pumpAfterAction(tester);
}

Future<void> openSettings(WidgetTester tester) async {
  await openDrawer(tester);
  await tapNavLabel(tester, RegExp(r'Settings|Paramètres', caseSensitive: false));
}

Future<void> expandSettingsSection(WidgetTester tester, String sectionKey) async {
  final section = find.text(EmcapLocale.t(sectionKey));
  await pumpUntilFound(tester, section);
  final scrollable = find.byType(Scrollable);
  if (scrollable.evaluate().isNotEmpty) {
    await tester.scrollUntilVisible(section.first, 500, scrollable: scrollable.first);
  }
  await tester.tap(section.first);
  await pumpAfterAction(tester);
}

Future<void> saveMobileScreenshot(
  IntegrationTestWidgetsFlutterBinding binding,
  String filename,
) async {
  await binding.convertFlutterSurfaceToImage();
  await binding.takeScreenshot(filename);
  final src = File('build/integration_test_screenshots/$filename.png');
  final dest = File('$mobileSignoffOutDir/$filename.png');
  if (await src.exists()) {
    await dest.parent.create(recursive: true);
    await src.copy(dest.path);
  }
}
