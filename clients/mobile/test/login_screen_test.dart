import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/shell.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';

class _FakeEmcapClient extends EmcapClient {
  _FakeEmcapClient() : super('http://localhost:8000');

  @override
  Future<List<String>> getAuthProviders() async => ['username_password', 'oauth'];
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await I18nService.loadBundles();
  });

  testWidgets('LoginScreen shows i18n title and provider chips', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: LoginScreen(client: _FakeEmcapClient()),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.descendant(
        of: find.byType(AppBar),
        matching: find.text(EmcapLocale.t('platform.login.title')),
      ),
      findsOneWidget,
    );
    expect(find.text(EmcapLocale.t('platform.login.provider.username_password')), findsOneWidget);
    expect(find.text(EmcapLocale.t('platform.login.provider.oauth')), findsOneWidget);
  });

  testWidgets('LoginScreen shows session expired message when flagged', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: LoginScreen(client: _FakeEmcapClient(), sessionExpired: true),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text(EmcapLocale.t('security.session.expired')), findsOneWidget);
  });
}
