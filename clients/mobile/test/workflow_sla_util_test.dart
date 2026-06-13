import 'package:flutter_test/flutter_test.dart';
import 'package:emcap_mobile/utils/workflow_sla_util.dart';

void main() {
  final now = DateTime.parse('2026-06-13T12:00:00.000Z');

  test('workflowSlaLevel overdue', () {
    expect(
      workflowSlaLevel('2026-06-13T10:00:00.000Z', now),
      WorkflowSlaLevel.overdue,
    );
  });

  test('workflowSlaLevel warning within 24h', () {
    expect(
      workflowSlaLevel('2026-06-14T08:00:00.000Z', now),
      WorkflowSlaLevel.warning,
    );
  });

  test('workflowSlaLevel ok beyond 24h', () {
    expect(
      workflowSlaLevel('2026-06-15T12:00:00.000Z', now),
      WorkflowSlaLevel.ok,
    );
  });
}
