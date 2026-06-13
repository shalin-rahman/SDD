enum WorkflowSlaLevel { ok, warning, overdue, none }

WorkflowSlaLevel workflowSlaLevel(String? dueAt, [DateTime? now]) {
  if (dueAt == null || dueAt.isEmpty) {
    return WorkflowSlaLevel.none;
  }
  final due = DateTime.tryParse(dueAt);
  if (due == null) {
    return WorkflowSlaLevel.none;
  }
  final reference = now ?? DateTime.now().toUtc();
  final hoursLeft = due.difference(reference).inMinutes / 60.0;
  if (hoursLeft < 0) {
    return WorkflowSlaLevel.overdue;
  }
  if (hoursLeft < 24) {
    return WorkflowSlaLevel.warning;
  }
  return WorkflowSlaLevel.ok;
}
