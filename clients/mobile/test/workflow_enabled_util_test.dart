import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/workflow_enabled_util.dart';

void main() {
  test('isWorkflowEnabled true when module and engine enabled', () {
    expect(
      isWorkflowEnabled({
        'modules': {'workflow': {'enabled': true}},
        'workflow': {'enabled': true},
      }),
      isTrue,
    );
  });

  test('isWorkflowEnabled false when module disabled', () {
    expect(
      isWorkflowEnabled({'modules': {'workflow': {'enabled': false}}}),
      isFalse,
    );
  });

  test('entityStartWorkflowCode returns STOCK_ADJUSTMENT for PRODUCT', () {
    expect(entityStartWorkflowCode('PRODUCT'), 'STOCK_ADJUSTMENT');
  });
}
