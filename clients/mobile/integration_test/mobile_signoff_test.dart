import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:emcap_mobile/services/i18n_service.dart';

import 'signoff_harness.dart';

/// Mobile Product-ready PNG pack — P25 finance, P26 org profile, P27 locale.
///
/// Prereq: local stack on :8000 (`scripts\start-emcap-local.bat`)
///
///   cd clients/mobile
///   flutter test integration_test/mobile_signoff_test.dart -d chrome
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> captureEntity(
    WidgetTester tester,
    IntegrationTestWidgetsFlutterBinding binding,
    Pattern menuLabel,
    String filename,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await signInMobile(tester);
    await openEntityMenu(tester, menuLabel);
    await openFirstRecord(tester);
    await saveMobileScreenshot(binding, filename);
  }

  testWidgets('P25 purchase order detail mobile PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await captureEntity(
      tester,
      binding,
      RegExp(r'Purchase Orders', caseSensitive: false),
      'phase25-purchase-order-detail-mobile',
    );
  });

  testWidgets('P25 sales order detail mobile PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await captureEntity(
      tester,
      binding,
      RegExp(r'Sales Orders', caseSensitive: false),
      'phase25-sales-order-detail-mobile',
    );
  });

  testWidgets('P25 invoice partial mobile PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await captureEntity(
      tester,
      binding,
      RegExp(r'Invoice', caseSensitive: false),
      'phase25-invoice-partial-mobile',
    );
  });

  testWidgets('P25 journal entry detail mobile PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await captureEntity(
      tester,
      binding,
      RegExp(r'Journal Entries', caseSensitive: false),
      'phase25-journal-entry-detail-mobile',
    );
  });

  testWidgets('P26 organization profile mobile PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await signInMobile(tester);
    await openSettings(tester);
    await expandSettingsSection(tester, 'settings.sections.organization');
    await saveMobileScreenshot(binding, 'phase26-organization-profile-mobile');
  });

  testWidgets('P27 locale switch bn-BD mobile PNG', (tester) async {
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await signInMobile(tester);

    final localeButton = find.byTooltip(EmcapLocale.t('toolbar.locale'));
    await pumpUntilFound(tester, localeButton);
    await tester.tap(localeButton);
    await pumpAfterAction(tester);

    final bnItem = find.text(EmcapLocale.t('toolbar.language.bn-BD'));
    await pumpUntilFound(tester, bnItem);
    await tester.tap(bnItem);
    await pumpAfterAction(tester);

    await saveMobileScreenshot(binding, 'phase27-locale-switch-bn-bd-mobile');
  });
}
