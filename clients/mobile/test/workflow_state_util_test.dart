import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/services/i18n_service.dart';
import 'package:emcap_mobile/utils/workflow_state_util.dart';

void main() {
  setUp(() {
    EmcapLocale.setLocale('en');
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
