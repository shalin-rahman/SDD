import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:emcap_mobile/widgets/emcap_badge.dart';

import 'signoff_harness.dart';

/// M2 gate integration (P15-T13 / P20-T03).
///
///   cd clients/mobile
///   flutter test integration_test/m2_product_detail_test.dart -d chrome
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('PRODUCT detail hero — M2 PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await signInMobile(tester);
    await openEntityMenu(tester, RegExp(r'Product', caseSensitive: false));
    await openFirstRecord(tester);

    expect(find.textContaining('—'), findsWidgets);
    expect(find.byType(EmcapStatusChip), findsWidgets);

    await saveMobileScreenshot(binding, 'phase15-mobile-product-detail');
  });
}
