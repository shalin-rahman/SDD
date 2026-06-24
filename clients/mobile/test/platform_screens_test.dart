import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/dashboard_screen.dart';
import 'package:emcap_mobile/app/notification_screen.dart';
import 'package:emcap_mobile/app/report_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/screen_test_harness.dart';

class _PlatformScreensClient extends EmcapClient {
  _PlatformScreensClient({
    this.reports = const [],
    this.dashboards = const [],
    this.reportRows = const [],
    this.notifications = const [],
    this.platformConfig = const {'notifications': {'email': true, 'sms': true}},
    this.failReports = false,
    this.failDashboards = false,
    this.failRun = false,
    this.failNotifications = false,
    this.failSend = false,
  }) : super('http://test');

  final List<Map<String, dynamic>> reports;
  final List<Map<String, dynamic>> dashboards;
  final List<Map<String, dynamic>> reportRows;
  final List<Map<String, dynamic>> notifications;
  final Map<String, dynamic> platformConfig;
  final bool failReports;
  final bool failDashboards;
  final bool failRun;
  final bool failNotifications;
  final bool failSend;

  @override
  Future<List<Map<String, dynamic>>> listReports() async {
    if (failReports) throw Exception('reports down');
    return reports;
  }

  @override
  Future<Map<String, dynamic>> runReport(String reportCode) async {
    if (failRun) throw Exception('run failed');
    return {'rows': reportRows};
  }

  @override
  Future<List<Map<String, dynamic>>> listReportRuns(String reportCode) async {
    return [{'id': 'run-1'}];
  }

  @override
  Future<List<Map<String, dynamic>>> listDashboards() async {
    if (failDashboards) throw Exception('dashboards down');
    return dashboards;
  }

  @override
  Future<List<Map<String, dynamic>>> listNotifications() async {
    if (failNotifications) throw Exception('notifications down');
    return notifications;
  }

  @override
  Future<Map<String, dynamic>> getPlatformConfig() async => platformConfig;

  @override
  Future<Map<String, dynamic>> sendNotification({
    required String channel,
    required String recipient,
    required String subject,
    required String body,
  }) async {
    if (failSend) throw Exception('send failed');
    return {'sent': true};
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('ReportScreen shows empty state', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReportScreen(client: _PlatformScreensClient()),
      ),
    );
    await pumpUntilFound(tester, find.text(EmcapLocale.t('platform.reports.noReports')));
  });

  testWidgets('ReportScreen lists reports and runs with rows', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReportScreen(
          client: _PlatformScreensClient(
            reports: [
              {'code': 'sales', 'name': 'Sales', 'entity_code': 'SALE', 'schedule_cron': '0 0 * * *'},
              {'code': 'inventory', 'name': 'Inventory', 'entity_code': 'PRODUCT'},
            ],
            reportRows: [
              {'sku': 'A', 'qty': 1},
            ],
          ),
        ),
      ),
    );
    await pumpUntilFound(tester, find.text('sales'));
    expect(find.text('0 0 * * *'), findsOneWidget);
    await tester.tap(find.text(EmcapLocale.t('platform.reports.run')).first);
    await pumpUntilFound(tester, find.text('A'));
    expect(find.textContaining(EmcapLocale.t('platform.reports.pastRuns')), findsOneWidget);
  });

  testWidgets('ReportScreen shows error when list fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReportScreen(client: _PlatformScreensClient(failReports: true)),
      ),
    );
    await pumpUntilFound(tester, find.textContaining(EmcapLocale.t('platform.common.failed')));
  });

  testWidgets('ReportScreen shows no rows after successful run', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReportScreen(
          client: _PlatformScreensClient(
            reports: [{'code': 'sales', 'name': 'Sales', 'entity_code': 'SALE'}],
            reportRows: const [],
          ),
        ),
      ),
    );
    await pumpUntilFound(tester, find.text('sales'));
    await tester.tap(find.text(EmcapLocale.t('platform.reports.run')));
    await pumpUntilFound(tester, find.text(EmcapLocale.t('platform.reports.noRows')));
  });

  testWidgets('DashboardScreen shows empty state', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: DashboardScreen(client: _PlatformScreensClient()),
      ),
    );
    await pumpUntilFound(tester, find.text(EmcapLocale.t('platform.dashboards.noDashboards')));
  });

  testWidgets('DashboardScreen renders dashboard cards', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: DashboardScreen(
          client: _PlatformScreensClient(
            dashboards: [
              {
                'code': 'ops',
                'name': 'Operations',
                'widgets': [
                  {'label': 'Open POs', 'value': '3'},
                  {'code': 'stock', 'metric': '120'},
                ],
              },
            ],
          ),
        ),
      ),
    );
    await pumpUntilFound(tester, find.text('Operations'));
    expect(find.text('Open POs'), findsOneWidget);
    expect(find.text('120'), findsOneWidget);
  });

  testWidgets('DashboardScreen shows error when load fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: DashboardScreen(client: _PlatformScreensClient(failDashboards: true)),
      ),
    );
    await pumpUntilFound(tester, find.textContaining(EmcapLocale.t('platform.common.failed')));
  });

  testWidgets('NotificationScreen loads channels and sends notification', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: NotificationScreen(
          client: _PlatformScreensClient(
            notifications: [
              {'channel': 'email', 'subject': 'Alert', 'recipient': 'ops@example.com'},
            ],
          ),
        ),
      ),
    );
    await pumpUntilFound(tester, find.text('Alert'));
    await tester.tap(find.text(EmcapLocale.t('platform.notifications.send')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text(EmcapLocale.t('platform.notifications.noSent')), findsNothing);
  });

  testWidgets('NotificationScreen shows send error', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: NotificationScreen(client: _PlatformScreensClient(failSend: true)),
      ),
    );
    await pumpUntilFound(tester, find.text(EmcapLocale.t('platform.notifications.send')));
    await tester.tap(find.text(EmcapLocale.t('platform.notifications.send')));
    await pumpUntilFound(tester, find.textContaining('send failed'));
  });

  testWidgets('NotificationScreen shows error when list fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: NotificationScreen(client: _PlatformScreensClient(failNotifications: true)),
      ),
    );
    await pumpUntilFound(tester, find.textContaining(EmcapLocale.t('platform.common.failed')));
  });
}
