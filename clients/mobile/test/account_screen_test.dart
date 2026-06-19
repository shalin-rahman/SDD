import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/account_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

import 'support/screen_test_harness.dart';

class _FakeAccountClient extends EmcapClient {
  _FakeAccountClient({
    this.failLoad = false,
    this.failEnroll = false,
    this.failVerify = false,
    this.paymentsEnabled = false,
    this.whiteLabel = false,
    this.longMetrics = false,
  }) : super('http://localhost:8000');

  final bool failLoad;
  final bool failEnroll;
  final bool failVerify;
  final bool paymentsEnabled;
  final bool whiteLabel;
  final bool longMetrics;

  @override
  Future<Map<String, dynamic>> getHealth() async {
    if (failLoad) throw Exception('health down');
    return {'multi_tenant': true, 'tenant_strategy': 'schema'};
  }

  @override
  Future<Map<String, dynamic>> listTenants() async => {'white_label': whiteLabel};

  @override
  Future<List<String>> getPermissions() async => ['inventory.access', 'product.read'];

  @override
  Future<List<Map<String, dynamic>>> getRoles() async => [
        {'code': 'ADMIN', 'name': 'Administrator'},
      ];

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {
        'modules': {
          if (paymentsEnabled) 'payments': {'enabled': true},
        },
      };

  @override
  Future<Map<String, dynamic>> getMe() async => {'user_id': 'admin'};

  @override
  Future<Map<String, dynamic>> enrollMfa() async {
    if (failEnroll) throw Exception('enroll failed');
    return {'secret': 'TEST-SECRET'};
  }

  @override
  Future<Map<String, dynamic>> verifyMfa(String code) async {
    if (failVerify) throw Exception('verify failed');
    return {'access_token': 'token-$code'};
  }

  @override
  Future<Map<String, dynamic>> checkAuth(String permission, {String? tenantId}) async {
    return {'allowed': true};
  }

  @override
  Future<String> getMetrics() async =>
      longMetrics ? ('#' * 120) : '# metrics sample';

  @override
  Future<Map<String, dynamic>> createPaymentIntent(String amount, {String currency = 'USD'}) async {
    return {'transaction_id': 'txn-1'};
  }

  @override
  Future<Map<String, dynamic>> confirmPaymentIntent(String transactionId) async {
    return {'status': 'confirmed', 'transaction_id': transactionId};
  }
}

/// Pump [AccountScreen] with a tall viewport so lazy list children build.
Future<void> pumpAccountScreen(WidgetTester tester, AccountScreen screen) async {
  await tester.binding.setSurfaceSize(const Size(800, 2400));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    MaterialApp(
      theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
      home: screen,
    ),
  );
  await settleAccountScreen(tester);
}

void main() {
  setUpAll(initMobileScreenTests);

  setUp(() async {
    await I18nService.loadBundles();
  });

  testWidgets('AccountScreen shows MFA step indicator and advances on enroll', (tester) async {
    await pumpAccountScreen(tester, AccountScreen(client: _FakeAccountClient()));

    expect(find.text(EmcapLocale.t('platform.account.mfaStep1')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.mfaStep2')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.totpCode')), findsNothing);

    await tester.tap(find.text(EmcapLocale.t('platform.account.enrollMfa')));
    await tester.pumpAndSettle();

    expect(find.textContaining('TEST-SECRET'), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.totpCode')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.verifyMfa')), findsOneWidget);
  });

  testWidgets('AccountScreen verifies MFA and shows snackbar', (tester) async {
    await pumpAccountScreen(tester, AccountScreen(client: _FakeAccountClient()));
    await tester.tap(find.text(EmcapLocale.t('platform.account.enrollMfa')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '123456');
    await tester.tap(find.text(EmcapLocale.t('platform.account.verifyMfa')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('platform.account.mfaVerified')), findsOneWidget);
  });

  testWidgets('AccountScreen shows payments disabled and white label banner', (tester) async {
    await pumpAccountScreen(tester, AccountScreen(client: _FakeAccountClient(whiteLabel: true)));
    expect(find.text(EmcapLocale.t('platform.account.whiteLabelEnabled')), findsOneWidget);
    await scrollAccountTo(tester, find.text(EmcapLocale.t('platform.account.paymentsDisabled')));
    expect(find.text(EmcapLocale.t('platform.account.paymentsDisabled')), findsOneWidget);
  });

  testWidgets('AccountScreen payment flow and admin actions', (tester) async {
    await pumpAccountScreen(
      tester,
      AccountScreen(client: _FakeAccountClient(paymentsEnabled: true, longMetrics: true)),
    );
    await scrollAccountTo(
      tester,
      find.textContaining('${EmcapLocale.t('platform.account.user')}:'),
    );
    expect(find.textContaining('${EmcapLocale.t('platform.account.user')}:'), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('platform.account.checkInventory')));
    await tester.pumpAndSettle();
    expect(find.textContaining(EmcapLocale.t('platform.account.allowed')), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('platform.account.fetchMetrics')));
    await tester.pumpAndSettle();
    final createPayment = find.text(EmcapLocale.t('platform.account.createPayment'));
    await scrollAccountTo(tester, createPayment);
    expect(createPayment, findsOneWidget);
    await tester.ensureVisible(createPayment);
    await tester.tap(createPayment);
    await pumpUntilFound(
      tester,
      find.textContaining(EmcapLocale.t('platform.account.paymentConfirmed')),
    );
  });

  testWidgets('AccountScreen shows load error', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 2400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: AccountScreen(client: _FakeAccountClient(failLoad: true)),
      ),
    );
    await pumpUntilFound(tester, find.textContaining(EmcapLocale.t('platform.common.failed')));
  });

  testWidgets('AccountScreen shows MFA enroll error', (tester) async {
    await pumpAccountScreen(tester, AccountScreen(client: _FakeAccountClient(failEnroll: true)));
    await tester.tap(find.text(EmcapLocale.t('platform.account.enrollMfa')));
    await pumpUntilFound(tester, find.text(EmcapLocale.t('platform.account.mfaEnrollFailed')));
  });

  testWidgets('AccountScreen shows MFA verify error', (tester) async {
    await pumpAccountScreen(tester, AccountScreen(client: _FakeAccountClient(failVerify: true)));
    await tester.tap(find.text(EmcapLocale.t('platform.account.enrollMfa')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '000000');
    await tester.tap(find.text(EmcapLocale.t('platform.account.verifyMfa')));
    await pumpUntilFound(tester, find.text(EmcapLocale.t('platform.account.mfaVerifyFailed')));
  });
}
