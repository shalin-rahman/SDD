import 'package:flutter_test/flutter_test.dart';

import 'package:emcap_mobile/utils/workflow_detail_util.dart';

void main() {
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
}
