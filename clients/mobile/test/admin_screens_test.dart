import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/app/admin_permissions_screen.dart';
import 'package:emcap_mobile/app/admin_roles_screen.dart';
import 'package:emcap_mobile/app/admin_security_screen.dart';
import 'package:emcap_mobile/app/admin_users_screen.dart';
import 'package:emcap_mobile/app/assistant_screen.dart';
import 'package:emcap_mobile/app/dashboard_screen.dart';
import 'package:emcap_mobile/app/notification_screen.dart';
import 'package:emcap_mobile/app/report_screen.dart';
import 'package:emcap_mobile/metadata_contract.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/widgets/currency_field.dart';
import 'package:emcap_mobile/widgets/detail_placeholder.dart';
import 'package:emcap_mobile/widgets/master_detail_layout.dart';

import 'support/fake_emcap_client.dart';
import 'support/screen_test_harness.dart';

void main() {
  setUpAll(initMobileScreenTests);

  Future<void> pump(WidgetTester tester, Widget home, {Size size = const Size(1200, 800)}) async {
    await tester.binding.setSurfaceSize(size);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: home,
      ),
    );
    await settleAdminScreen(tester);
  }

  testWidgets('AdminUsersScreen loads users and opens create form', (tester) async {
    await pump(tester, AdminUsersScreen(client: FakeEmcapClient()));
    expect(find.text('admin'), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('admin.users.new')));
    await tester.pumpAndSettle();
    expect(find.text(EmcapLocale.t('admin.users.createTitle')), findsOneWidget);
  });

  testWidgets('AdminRolesScreen loads roles', (tester) async {
    await pump(tester, AdminRolesScreen(client: FakeEmcapClient()));
    expect(find.text('Admin'), findsOneWidget);
  });

  testWidgets('AdminPermissionsScreen lists permissions', (tester) async {
    await pump(tester, AdminPermissionsScreen(client: FakeEmcapClient()));
    expect(find.textContaining(EmcapLocale.t('admin.permissions.catalog')), findsOneWidget);
  });

  testWidgets('AdminSecurityScreen loads policies', (tester) async {
    await pump(
      tester,
      Scaffold(body: AdminSecurityScreen(client: FakeEmcapClient())),
    );
    expect(find.text(EmcapLocale.t('admin.security.title')), findsOneWidget);
  });

  testWidgets('AssistantScreen sends chat message when enabled', (tester) async {
    await pump(tester, AssistantScreen(client: FakeEmcapClient(), enabled: true));
    await tester.enterText(find.byType(TextField), 'hello');
    await tester.tap(find.text(EmcapLocale.t('platform.assistant.chat')));
    await settleAdminScreen(tester);
    expect(find.textContaining('echo: hello'), findsOneWidget);
  });

  testWidgets('DashboardScreen lists dashboards', (tester) async {
    await pump(tester, DashboardScreen(client: FakeEmcapClient()));
    expect(find.text('Main'), findsOneWidget);
    expect(find.text('Revenue'), findsOneWidget);
  });

  testWidgets('NotificationScreen lists notifications', (tester) async {
    await pump(tester, NotificationScreen(client: FakeEmcapClient()));
    expect(find.text('Hello'), findsOneWidget);
  });

  testWidgets('ReportScreen lists reports and runs selected report', (tester) async {
    await pump(tester, ReportScreen(client: FakeEmcapClient()));
    expect(find.text('Sales Report'), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('platform.reports.run')));
    await settleAdminScreen(tester);
    expect(find.text('100'), findsOneWidget);
  });

  testWidgets('CurrencyField and layout widgets render', (tester) async {
    final controller = TextEditingController(text: '10.00');
    addTearDown(controller.dispose);
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 1200,
            height: 800,
            child: MasterDetailLayout(
              listPane: const Text('master'),
              detailPane: DetailPlaceholder(message: 'Select item'),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('master'), findsOneWidget);
    expect(find.text('Select item'), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CurrencyField(
            field: FormFieldMetadata(
              name: 'amount',
              label: 'Amount',
              fieldType: 'currency',
              currencyCode: 'USD',
            ),
            label: 'Amount',
            controller: controller,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Amount'), findsOneWidget);
    await tester.enterText(find.byType(TextField), '25');
    expect(controller.text, contains('25'));
  });
}
