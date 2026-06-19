import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/utils/workflow_detail_util.dart';

import 'support/screen_test_harness.dart';

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  test('workflowRowActions draft returns submit', () {
    expect(workflowRowActions('draft'), ['submit']);
  });

  test('workflowRowActions submitted returns approve and reject', () {
    expect(workflowRowActions('submitted'), ['approve', 'reject']);
  });

  test('workflowRowActions approved returns empty', () {
    expect(workflowRowActions('approved'), isEmpty);
  });

  test('workflowCanDelegate only for submitted', () {
    expect(workflowCanDelegate('submitted'), isTrue);
    expect(workflowCanDelegate('draft'), isFalse);
    expect(workflowCanDelegate('approved'), isFalse);
  });

  test('workflowActionLabel maps known actions', () {
    expect(workflowActionLabel('submit'), EmcapLocale.t('platform.workflow.submit'));
    expect(workflowActionLabel('approve'), EmcapLocale.t('platform.workflow.approve'));
    expect(workflowActionLabel('custom'), 'custom');
  });

  test('workflowDetailEntries formats state and due_at', () {
    final entries = workflowDetailEntries(
      {
        'id': 'wf-1',
        'workflow_code': 'approval',
        'current_state': 'submitted',
        'due_at': '2026-06-20T12:00:00Z',
        'assignee': 'admin',
        'empty': '',
      },
      locale: 'en',
    );
    expect(entries.any((e) => e.key == 'workflow_code'), isTrue);
    expect(entries.any((e) => e.key == 'current_state'), isTrue);
    expect(entries.any((e) => e.key == 'due_at'), isTrue);
    expect(entries.any((e) => e.key == 'empty'), isFalse);
  });
}
