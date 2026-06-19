import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/utils/workflow_state_util.dart';

import 'support/screen_test_harness.dart';

void main() {
  setUpAll(() async {
    await initMobileScreenTests();
  });

  setUp(() {
    EmcapLocale.setLocaleTag('en-US');
  });

  test('workflowStateLabel localizes known states', () {
    expect(workflowStateLabel('draft'), 'Draft');
    expect(workflowStateLabel('submitted'), 'Submitted');
    expect(workflowStateLabel('approved'), 'Approved');
  });

  test('workflowStateLabel falls back to raw code', () {
    expect(workflowStateLabel('custom_state'), 'custom_state');
  });
}
