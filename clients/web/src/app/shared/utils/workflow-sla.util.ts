export type WorkflowSlaLevel = 'ok' | 'warning' | 'overdue' | 'none';

/** SLA badge: green (>24h), amber (<24h), red (overdue). */
export function workflowSlaLevel(dueAt: string | null | undefined, nowMs = Date.now()): WorkflowSlaLevel {
  if (!dueAt) {
    return 'none';
  }
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) {
    return 'none';
  }
  const hoursLeft = (due - nowMs) / (1000 * 60 * 60);
  if (hoursLeft < 0) {
    return 'overdue';
  }
  if (hoursLeft < 24) {
    return 'warning';
  }
  return 'ok';
}
