import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/api/emcap_client.dart';
import 'package:emcap_mobile/app/workflow_inbox_screen.dart';
import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/theme.dart';
import 'package:emcap_mobile/utils/workflow_state_util.dart';

import 'support/fake_emcap_client.dart';
import 'support/screen_test_harness.dart';

class _WorkflowClient extends FakeEmcapClient {
  var transitionCalls = 0;
  var delegateCalls = 0;

  @override
  Future<Map<String, dynamic>> transitionWorkflow(
    String instanceId,
    String action,
    String actor,
  ) async {
    transitionCalls++;
    return {'id': instanceId, 'current_state': 'approved'};
  }

  @override
  Future<Map<String, dynamic>> delegateWorkflow(String instanceId, String delegateTo) async {
    delegateCalls++;
    return {'id': instanceId, 'assignee': delegateTo};
  }
}

class _ErrorWorkflowClient extends EmcapClient {
  @override
  Future<List<Map<String, dynamic>>> listWorkflowInstances({String? recordId}) async {
    throw Exception('network');
  }
}

void main() {
  setUpAll(initMobileScreenTests);

  testWidgets('WorkflowInboxScreen lists instances and filters', (tester) async {
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(client: FakeEmcapClient()),
      ),
    );
    await settleWorkflowInbox(tester);

    expect(find.text('approval'), findsOneWidget);
    expect(find.textContaining('admin'), findsWidgets);

    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    final submittedLabel = workflowStateLabel('submitted');
    final submittedFinder = find.text(submittedLabel);
    await tester.tap(submittedFinder.evaluate().isNotEmpty ? submittedFinder.last : find.text('submitted').last);
    await tester.pumpAndSettle();
    expect(find.text('approval'), findsOneWidget);
  });

  testWidgets('WorkflowInboxScreen shows detail escalate transition delegate', (tester) async {
    final client = _WorkflowClient();
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(client: client),
      ),
    );
    await settleWorkflowInbox(tester);

    await tester.tap(find.text(EmcapLocale.t('platform.workflow.detail')));
    await settleWorkflowInbox(tester);
    expect(find.text(EmcapLocale.t('platform.workflow.detailTitle')), findsOneWidget);

    await tester.tap(find.text(EmcapLocale.t('common.cancel')));
    await settleWorkflowInbox(tester);

    await tester.tap(find.text(EmcapLocale.t('platform.workflow.escalate')));
    await settleWorkflowInbox(tester);
    expect(find.textContaining(EmcapLocale.t('platform.workflow.escalated')), findsOneWidget);

    await tester.tap(find.text(EmcapLocale.t('platform.workflow.approve')));
    await tester.pumpAndSettle();
    await tester.tap(find.text(EmcapLocale.t('platform.workflow.approve')).last);
    await settleWorkflowInbox(tester);
    expect(client.transitionCalls, 1);

    await tester.tap(find.text(EmcapLocale.t('platform.workflow.delegate')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'inventory-manager');
    await tester.tap(find.text(EmcapLocale.t('common.save')));
    await settleWorkflowInbox(tester);
    expect(client.delegateCalls, 1);
  });

  testWidgets('WorkflowInboxScreen shows error on load failure', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(client: _ErrorWorkflowClient()),
      ),
    );
    await settleWorkflowInbox(tester);
    expect(find.text(EmcapLocale.t('platform.workflow.loadFailed')), findsOneWidget);
  });

  testWidgets('WorkflowInboxScreen open entity callback fires', (tester) async {
    String? opened;
    await tester.binding.setSurfaceSize(const Size(1200, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: EmcapTheme.buildThemeData(seed: Colors.blue, brightness: Brightness.light),
        home: WorkflowInboxScreen(
          client: FakeEmcapClient(),
          onOpenEntity: (code) => opened = code,
        ),
      ),
    );
    await settleWorkflowInbox(tester);
    await tester.tap(find.textContaining('PRODUCT ·'));
    await tester.pumpAndSettle();
    expect(opened, 'PRODUCT');
  });
}
