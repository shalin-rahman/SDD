import 'package:flutter/material.dart';

import 'package:flutter_test/flutter_test.dart';

import 'package:integration_test/integration_test.dart';



import 'package:emcap_mobile/widgets/emcap_badge.dart';



import 'package:emcap_mobile/main.dart' as app;



/// M2 gate integration skeleton (P15-T13 / P20-T03 / P18-T09).

///

/// Run when Flutter SDK is installed:

///   cd clients/mobile

///   flutter pub get

///   flutter test integration_test/m2_product_detail_test.dart -d chrome

///

/// Requires local API stack + seed (`scripts/run-emcap.bat --stack-only --local`).

/// Manual fallback: `scripts/capture-m2-mobile-screenshots.md`

void main() {

  IntegrationTestWidgetsFlutterBinding.ensureInitialized();



  testWidgets('PRODUCT detail hero — M2 integration path', (tester) async {

    app.main();

    await tester.pumpAndSettle(const Duration(seconds: 5));



    // LoginScreen pre-fills demo credentials; button label is i18n `platform.login.signIn`.

    final signIn = find.byType(ElevatedButton);

    expect(signIn, findsWidgets);

    await tester.tap(signIn.first);

    await tester.pumpAndSettle(const Duration(seconds: 8));



    // Navigate to Products via drawer/rail label from menus API.

    final productsEntry = find.textContaining('Product');

    if (productsEntry.evaluate().isEmpty) {

      fail('Products menu not found — ensure API stack + seed are running');

    }

    await tester.tap(productsEntry.first);

    await tester.pumpAndSettle(const Duration(seconds: 8));



    // Open first grid row (list-only route → push record).

    final dataRows = find.byType(DataRow);

    expect(dataRows, findsWidgets);

    await tester.tap(dataRows.first);

    await tester.pumpAndSettle(const Duration(seconds: 3));



    // Hero headline (SKU — Name) and status badge (M2 DoD §5).

    expect(find.textContaining('—'), findsWidgets);

    expect(find.byType(EmcapStatusChip), findsWidgets);



    // Optional PNG when SDK available:

    // binding.convertFlutterSurfaceToImage();

    // binding.takeScreenshot('phase15-mobile-product-detail');

    // → docs/product/screenshots/phase15-mobile-product-detail.png

  });

}

