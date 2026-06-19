import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:emcap_mobile/main.dart' as app;

/// P24-T03 mobile admin Product-ready PNG pack.
///
/// Run (repo root stack on :8000):
///   cd clients/mobile
///   flutter test integration_test/admin_signoff_test.dart -d chrome
const _outDir = '../../docs/product/screenshots';

Future<void> _signIn(WidgetTester tester) async {
  app.main();
  await tester.pumpAndSettle(const Duration(seconds: 5));

  final signIn = find.byType(ElevatedButton);
  expect(signIn, findsWidgets);
  await tester.tap(signIn.first);
  await tester.pumpAndSettle(const Duration(seconds: 10));
}

Future<void> _openDrawer(WidgetTester tester) async {
  final menu = find.byIcon(Icons.menu);
  if (menu.evaluate().isNotEmpty) {
    await tester.tap(menu.first);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }
}

Future<void> _tapNavLabel(WidgetTester tester, Pattern label) async {
  final entry = find.textContaining(label);
  expect(entry, findsWidgets, reason: 'Nav item matching $label not found');
  await tester.tap(entry.first);
  await tester.pumpAndSettle(const Duration(seconds: 6));
}

Future<void> _saveScreenshot(
  IntegrationTestWidgetsFlutterBinding binding,
  String filename,
) async {
  await binding.convertFlutterSurfaceToImage();
  await binding.takeScreenshot(filename);
  final src = File('build/integration_test_screenshots/$filename.png');
  final dest = File('$_outDir/$filename.png');
  if (await src.exists()) {
    await dest.parent.create(recursive: true);
    await src.copy(dest.path);
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('P24-T03 admin users PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await _signIn(tester);
    await _openDrawer(tester);
    await _tapNavLabel(tester, RegExp(r'Users|Utilisateurs', caseSensitive: false));
    await _saveScreenshot(binding, 'phase24-mobile-admin-users');
  });

  testWidgets('P24-T03 admin roles PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await _signIn(tester);
    await _openDrawer(tester);
    await _tapNavLabel(tester, RegExp(r'Roles|Rôles', caseSensitive: false));
    await _saveScreenshot(binding, 'phase24-mobile-admin-roles');
  });

  testWidgets('P24-T03 admin security PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await _signIn(tester);
    await _openDrawer(tester);
    await _tapNavLabel(tester, RegExp(r'Security|Sécurité|Field access', caseSensitive: false));
    await _saveScreenshot(binding, 'phase24-mobile-admin-security');
  });
}
