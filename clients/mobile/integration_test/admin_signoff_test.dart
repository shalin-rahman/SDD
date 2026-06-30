import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'signoff_harness.dart';

/// P24-T03 mobile admin Product-ready PNG pack.
///
///   cd clients/mobile
///   flutter test integration_test/admin_signoff_test.dart -d chrome
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('P24-T03 admin users PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await signInMobile(tester);
    await openDrawer(tester);
    await tapNavLabel(tester, RegExp(r'Users|Utilisateurs', caseSensitive: false));
    await saveMobileScreenshot(binding, 'phase24-mobile-admin-users');
  });

  testWidgets('P24-T03 admin roles PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await signInMobile(tester);
    await openDrawer(tester);
    await tapNavLabel(tester, RegExp(r'Roles|Rôles', caseSensitive: false));
    await saveMobileScreenshot(binding, 'phase24-mobile-admin-roles');
  });

  testWidgets('P24-T03 admin security PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await signInMobile(tester);
    await openDrawer(tester);
    await tapNavLabel(tester, RegExp(r'Security|Sécurité|Field access', caseSensitive: false));
    await saveMobileScreenshot(binding, 'phase24-mobile-admin-security');
  });
}
