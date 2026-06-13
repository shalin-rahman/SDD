import { workflowSlaLevel } from './workflow-sla.util';

describe('workflowSlaLevel', () => {
  const now = Date.parse('2026-06-13T12:00:00.000Z');

  it('returns none when due_at is missing', () => {
    expect(workflowSlaLevel(null, now)).toBe('none');
  });

  it('returns overdue when past due', () => {
    expect(workflowSlaLevel('2026-06-13T10:00:00.000Z', now)).toBe('overdue');
  });

  it('returns warning when due within 24 hours', () => {
    expect(workflowSlaLevel('2026-06-14T08:00:00.000Z', now)).toBe('warning');
  });

  it('returns ok when due more than 24 hours away', () => {
    expect(workflowSlaLevel('2026-06-15T12:00:00.000Z', now)).toBe('ok');
  });
});
