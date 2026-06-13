import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:emcap_mobile/main.dart' as app;

/// M2 gate skeleton (P15-T13 / P20-T03).
///
/// Run when Flutter SDK is installed:
///   cd clients/mobile
///   flutter pub get
///   flutter test integration_test/m2_product_detail_test.dart -d chrome
///
/// Manual fallback: scripts/capture-m2-mobile-screenshots.md
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('PRODUCT detail hero — M2 screenshot placeholder', (tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 5));

    // Login (defaults pre-filled in LoginScreen).
    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
    await tester.pumpAndSettle(const Duration(seconds: 8));

    // Navigate to Products via drawer/rail label from menus API.
    final productsEntry = find.textContaining('Product');
    if (productsEntry.evaluate().isEmpty) {
      fail('Products menu not found — ensure API stack + seed are running');
    }
    await tester.tap(productsEntry.first);
    await tester.pumpAndSettle(const Duration(seconds: 8));

    // Select first grid row.
    final dataRows = find.byType(DataRow);
    expect(dataRows, findsWidgets);
    await tester.tap(dataRows.first);
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Hero headline (SKU — Name) and status chip.
    expect(find.byType(Chip), findsWidgets);

    // TODO(P15-T13): bindIntegrationTestScreenshot and write to
    // docs/product/screenshots/phase15-mobile-product-detail.png
    // await binding.convertFlutterSurfaceToImage();
    // await binding.takeScreenshot('phase15-mobile-product-detail');
  });
}
