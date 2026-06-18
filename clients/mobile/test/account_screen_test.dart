import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/account_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

class _FakeAccountClient extends EmcapClient {
  _FakeAccountClient() : super('http://localhost:8000');

  @override
  Future<Map<String, dynamic>> getHealth() async => {
        'multi_tenant': true,
        'tenant_strategy': 'schema',
      };

  @override
  Future<Map<String, dynamic>> listTenants() async => {'white_label': false};

  @override
  Future<List<String>> getPermissions() async => ['inventory.access'];

  @override
  Future<List<Map<String, dynamic>>> getRoles() async => [
        {'code': 'ADMIN'},
      ];

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => {'modules': {}};

  @override
  Future<Map<String, dynamic>> getMe() async => {'user_id': 'admin'};

  @override
  Future<Map<String, dynamic>> enrollMfa() async => {'secret': 'TEST-SECRET'};

  @override
  Future<Map<String, dynamic>> verifyMfa(String code) async => {'access_token': 'token-$code'};
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await I18nService.loadBundles();
  });

  testWidgets('AccountScreen shows MFA step indicator and advances on enroll', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: AccountScreen(client: _FakeAccountClient()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text(EmcapLocale.t('platform.account.mfaStep1')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.mfaStep2')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.totpCode')), findsNothing);

    await tester.tap(find.text(EmcapLocale.t('platform.account.enrollMfa')));
    await tester.pumpAndSettle();

    expect(find.textContaining('TEST-SECRET'), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.totpCode')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.account.verifyMfa')), findsOneWidget);
  });
}
